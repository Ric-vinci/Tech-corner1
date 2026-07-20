import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { captureBuyOrder } from "@/lib/buy-payment/capture";
import { releaseStockOnce, takeStockOnce } from "@/lib/buy-payment/stock";
import { unitsForItems } from "@/lib/buy-payment/units";

/**
 * PayPal webhook handling for BUY orders (money in).
 *
 * The browser redirect to /api/checkout/buy/paypal/return is only a UX
 * convenience — customers close tabs and lose signal. These webhooks are the
 * source of truth: they capture an approved order server-side and unwind a
 * refunded/denied one. All handlers are idempotent (PayPal delivers at-least-once).
 */
const BUY_EVENTS = new Set([
  "CHECKOUT.ORDER.APPROVED",
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.DENIED",
  "PAYMENT.CAPTURE.REFUNDED",
  "PAYMENT.CAPTURE.REVERSED",
]);

export function isBuyOrderEvent(eventType: string): boolean {
  return BUY_EVENTS.has(eventType);
}

type BuyOrder = {
  id: string;
  items: { variantId: string | null; quantity: number }[] | null;
  payment_reference: string | null;
  payment_status: string | null;
  status: string | null;
};

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/** Resolve the buy_order behind a PayPal event (our id or the PayPal reference). */
async function findOrder(resource: Record<string, any>): Promise<BuyOrder | null> {
  const supabase = getSupabaseAdmin();
  const candidates: string[] = [
    resource?.supplementary_data?.related_ids?.order_id, // capture → PayPal order id
    resource?.id, // PayPal order id (CHECKOUT.ORDER.*) or capture id
    resource?.purchase_units?.[0]?.reference_id, // our buy_order id (set at creation)
    resource?.custom_id,
    resource?.invoice_id,
  ].filter((v): v is string => typeof v === "string" && v.length > 0);

  for (const candidate of candidates) {
    const query = supabase.from("buy_orders").select("id, items, payment_reference, payment_status, status");
    const { data } = isUuid(candidate)
      ? await query.eq("id", candidate).maybeSingle()
      : await query.eq("payment_reference", candidate).maybeSingle();
    if (data) return data as BuyOrder;
  }
  return null;
}

/** The devices on an order, so stock can be released or re-taken. */
const unitsFor = (order: BuyOrder) => unitsForItems(order.items ?? []);

export async function handleBuyOrderEvent(event: { event_type: string; resource?: Record<string, any> }) {
  const supabase = getSupabaseAdmin();
  const resource = event.resource ?? {};
  const order = await findOrder(resource);
  if (!order) return { ignored: "unknown buy order" };

  const now = new Date().toISOString();

  // ---- Approved but not captured: capture it now (the browser may never return).
  if (event.event_type === "CHECKOUT.ORDER.APPROVED") {
    if (order.payment_status === "paid") return { ok: true, alreadyPaid: true };
    const paypalOrderId = typeof resource.id === "string" ? resource.id : order.payment_reference;
    if (!paypalOrderId) return { ignored: "no paypal order id" };

    // Shared claim-then-capture: the browser return URL races this handler.
    const result = await captureBuyOrder(order.id, paypalOrderId, await unitsFor(order));
    if (!result.paid) return { ignored: result.reason ?? "not captured yet" };
    return { ok: true, captured: true };
  }

  // ---- Capture completed (usually right after approval, or via the return URL).
  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    if (order.payment_status === "paid") return { ok: true, alreadyPaid: true };
    await supabase
      .from("buy_orders")
      .update({ status: "paid", payment_status: "paid", payment_reference: resource.id ?? order.payment_reference, paid_at: now, updated_at: now })
      .eq("id", order.id);
    // Normally already taken when the order was created; take-once makes a
    // repeat delivery of this webhook harmless rather than a second decrement.
    await takeStockOnce(order.id, await unitsFor(order));
    return { ok: true, paid: true };
  }

  // ---- Money came back: unwind the order and put the devices back in stock.
  const refunded = event.event_type === "PAYMENT.CAPTURE.REFUNDED" || event.event_type === "PAYMENT.CAPTURE.REVERSED";
  const denied = event.event_type === "PAYMENT.CAPTURE.DENIED";
  if (refunded || denied) {
    const nextStatus = refunded ? "refunded" : "failed";
    if (order.payment_status === nextStatus) return { ok: true, alreadyApplied: true };
    await supabase
      .from("buy_orders")
      .update({ status: refunded ? "refunded" : "cancelled", payment_status: nextStatus, updated_at: now })
      .eq("id", order.id);
    await releaseStockOnce(order.id, await unitsFor(order)); // device is ours again
    return { ok: true, [nextStatus]: true };
  }

  return { ignored: event.event_type };
}
