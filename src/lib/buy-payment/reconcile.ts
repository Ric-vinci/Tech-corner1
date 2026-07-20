import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { adminRequest, isShopifyAdminConfigured } from "@/lib/shopify/admin-client";
import { unitsForItems } from "@/lib/buy-payment/units";

/**
 * Safety net: does the money agree with the stock?
 *
 * Stock moves are best-effort by design — they must never fail a payment that
 * has already settled — so a Shopify outage can leave a paid order whose device
 * is still listed for sale, or a refunded one whose device never came back.
 * Nothing else would notice until a customer bought a phone we'd already sold.
 *
 * Read-only: it reports, it never "fixes" anything on its own. Money problems
 * should be looked at by a person, not silently patched.
 */
export type Discrepancy = {
  orderId: string;
  kind: "paid_but_in_stock" | "refunded_but_not_restored" | "stock_never_taken";
  detail: string;
  total: number | null;
  createdAt: string | null;
};

export type ReconcileReport = {
  checked: number;
  discrepancies: Discrepancy[];
  shopifyAvailable: boolean;
};

/** ACTIVE = still sellable on the storefront. */
async function activeProductIds(productIds: string[]): Promise<Set<string>> {
  const active = new Set<string>();
  if (!productIds.length || !isShopifyAdminConfigured()) return active;
  for (let i = 0; i < productIds.length; i += 50) {
    const batch = productIds.slice(i, i + 50);
    try {
      const data = await adminRequest<{ nodes: ({ id: string; status: string } | null)[] }>(
        `query($ids: [ID!]!) { nodes(ids: $ids) { ... on Product { id status } } }`,
        { ids: batch },
        { noStore: true },
      );
      for (const n of data.nodes) if (n?.id && n.status === "ACTIVE") active.add(n.id);
    } catch (err) {
      console.error("[reconcile] Shopify read failed:", err);
    }
  }
  return active;
}

export async function reconcileBuyOrders(limit = 100): Promise<ReconcileReport> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("buy_orders")
    .select("id, items, total, payment_status, stock_taken, stock_released, created_at")
    .in("payment_status", ["paid", "refunded"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("[reconcile] scan failed:", error);
    return { checked: 0, discrepancies: [], shopifyAvailable: isShopifyAdminConfigured() };
  }

  const perOrder = await Promise.all(
    data.map(async (o) => ({ order: o, units: await unitsForItems((o.items as any[]) ?? []) })),
  );
  const active = await activeProductIds([...new Set(perOrder.flatMap((p) => p.units.map((u) => u.productId)))]);

  const discrepancies: Discrepancy[] = [];
  for (const { order, units } of perOrder) {
    const base = { orderId: order.id, total: order.total, createdAt: order.created_at };

    if (order.payment_status === "paid") {
      if (!order.stock_taken) {
        discrepancies.push({ ...base, kind: "stock_never_taken", detail: "Order is paid but stock was never taken." });
        continue;
      }
      const stillSellable = units.filter((u) => active.has(u.productId));
      if (stillSellable.length) {
        discrepancies.push({
          ...base,
          kind: "paid_but_in_stock",
          detail: `Paid, but ${stillSellable.length} device(s) still listed for sale — could be sold twice.`,
        });
      }
    }

    if (order.payment_status === "refunded" && order.stock_taken && !order.stock_released) {
      discrepancies.push({
        ...base,
        kind: "refunded_but_not_restored",
        detail: "Refunded, but the device was never put back into stock.",
      });
    }
  }

  return { checked: data.length, discrepancies, shopifyAvailable: isShopifyAdminConfigured() };
}
