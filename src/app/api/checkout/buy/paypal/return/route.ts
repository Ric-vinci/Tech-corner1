import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { capturePaypalOrder } from "@/lib/buy-payment/paypal";

/**
 * PayPal redirects the customer's browser here after approval:
 *   ?order=<buy_order id>&token=<paypal order id>&PayerID=...
 * We capture the payment and mark the order paid, then send them to the
 * success page (or back to checkout on failure). This is a browser GET.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order");
  const paypalOrderId = url.searchParams.get("token");
  const origin = url.origin;

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/buy-used/checkout?error=${encodeURIComponent(reason)}`);

  if (!orderId || !paypalOrderId) return fail("payment_cancelled");

  const supabase = getSupabaseAdmin();
  const { data: order } = await supabase
    .from("buy_orders")
    .select("id, payment_reference, payment_status")
    .eq("id", orderId)
    .single();

  // Verify the returned PayPal order matches what we created for this order.
  if (!order || order.payment_reference !== paypalOrderId) return fail("payment_mismatch");
  if (order.payment_status === "paid") return NextResponse.redirect(`${origin}/buy-used/checkout/success?ref=${orderId}`);

  try {
    const result = await capturePaypalOrder(paypalOrderId);
    if (!result.captured) return fail("payment_not_completed");

    await supabase
      .from("buy_orders")
      .update({
        status: "paid",
        payment_status: "paid",
        payment_reference: result.captureId ?? paypalOrderId,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return NextResponse.redirect(`${origin}/buy-used/checkout/success?ref=${orderId}`);
  } catch {
    return fail("payment_error");
  }
}
