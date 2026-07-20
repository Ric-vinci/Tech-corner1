import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { adminRequest, isShopifyAdminConfigured } from "@/lib/shopify/admin-client";

/**
 * The physical devices behind a buy order's lines.
 *
 * Orders store the cart lines (which carry variant ids), but stock lives on the
 * Shopify *product* — one product per physical unit — so the variants have to be
 * resolved back to their products before stock can move either way.
 */
export type OrderUnit = { productId: string; qty: number };
type OrderItem = { variantId?: string | null; quantity?: number | null };

export async function unitsForItems(items: OrderItem[]): Promise<OrderUnit[]> {
  const variantIds = items.map((i) => i?.variantId).filter((v): v is string => Boolean(v));
  if (!variantIds.length || !isShopifyAdminConfigured()) return [];
  try {
    const data = await adminRequest<{ nodes: ({ id: string; product: { id: string } | null } | null)[] }>(
      `query($ids: [ID!]!) { nodes(ids: $ids) { ... on ProductVariant { id product { id } } } }`,
      { ids: variantIds },
      { noStore: true },
    );
    const byVariant = new Map<string, string>();
    for (const n of data.nodes) if (n?.id && n.product?.id) byVariant.set(n.id, n.product.id);
    return items
      .map((i) => ({ productId: i?.variantId ? byVariant.get(i.variantId) ?? "" : "", qty: Math.max(1, Number(i?.quantity) || 1) }))
      .filter((u) => u.productId);
  } catch {
    return [];
  }
}

export async function unitsForOrder(orderId: string): Promise<OrderUnit[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("buy_orders").select("items").eq("id", orderId).maybeSingle();
  return unitsForItems((data?.items as OrderItem[] | null) ?? []);
}
