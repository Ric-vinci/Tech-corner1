import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { capturePaypalOrder } from "@/lib/buy-payment/paypal";
import { takeStockOnce } from "@/lib/buy-payment/stock";

/**
 * Capture a PayPal buy order and mark it paid — the single path used by BOTH
 * the browser return URL and the webhook.
 *
 * Those two race constantly: PayPal fires CHECKOUT.ORDER.APPROVED at the same
 * moment it redirects the customer back. So the order is *claimed* with a
 * conditional update before any money moves — only the caller that flips
 * `payment_status` from 'pending' to 'capturing' proceeds. The loser returns
 * the already-in-flight result instead of capturing a second time.
 */
export type CaptureResult = { paid: boolean; reason?: string };

export async function captureBuyOrder(
  orderId: string,
  paypalOrderId: string,
  units: { productId: string; qty: number }[] = [],
): Promise<CaptureResult> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  // Atomic claim. Postgres applies this UPDATE ... WHERE as one statement, so
  // exactly one concurrent caller can match 'pending' and win.
  const { data: claimed } = await supabase
    .from("buy_orders")
    .update({ payment_status: "capturing", updated_at: now })
    .eq("id", orderId)
    .eq("payment_status", "pending")
    .select("id")
    .maybeSingle();

  if (!claimed) {
    // Either already paid, or another caller is mid-capture.
    const { data: current } = await supabase.from("buy_orders").select("payment_status").eq("id", orderId).maybeSingle();
    if (current?.payment_status === "paid") return { paid: true };
    return { paid: false, reason: current?.payment_status === "capturing" ? "capture_in_progress" : "not_capturable" };
  }

  let result: Awaited<ReturnType<typeof capturePaypalOrder>>;
  try {
    result = await capturePaypalOrder(paypalOrderId);
  } catch (err) {
    console.error(`[buy-capture] capture threw for ${orderId}:`, err);
    await supabase.from("buy_orders").update({ payment_status: "pending", updated_at: now }).eq("id", orderId);
    return { paid: false, reason: "capture_error" };
  }

  if (!result.captured) {
    // Release the claim so a later webhook or retry can try again.
    await supabase.from("buy_orders").update({ payment_status: "pending", updated_at: now }).eq("id", orderId);
    return { paid: false, reason: "not_completed" };
  }

  await supabase
    .from("buy_orders")
    .update({
      status: "paid",
      payment_status: "paid",
      payment_reference: result.captureId ?? paypalOrderId,
      paid_at: now,
      updated_at: now,
    })
    .eq("id", orderId);

  // Normally a no-op: stock was taken when the order was created. It matters
  // only if that reservation failed, so a paid order still leaves stock.
  await takeStockOnce(orderId, units);

  return { paid: true };
}
