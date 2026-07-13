import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendTradeInPaidEmail } from "@/lib/email/trade-in";
import { statusFromWebhookEvent, verifyWebhookSignature } from "@/lib/payout";
import type { TradeInSubmission } from "@/lib/trade-in/types";

/**
 * PAYOUTS-ITEM.* webhook — settles payouts without anyone clicking "Check status".
 *
 * The endpoint is public, so the signature is verified with PayPal before we
 * touch the database. Without that, a stranger could POST here and mark
 * trade-ins as paid.
 *
 * PayPal retries on non-2xx, so we return 200 for anything we've handled or can
 * safely ignore, and only non-2xx when we genuinely want a retry.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  let verified: boolean;
  try {
    verified = await verifyWebhookSignature(request.headers, rawBody);
  } catch (err) {
    console.error("[paypal-webhook] verification error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
  if (!verified) {
    console.warn("[paypal-webhook] rejected: bad signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const status = statusFromWebhookEvent(event.event_type);
  if (!status) {
    // Not a payout event we care about. Acknowledge so PayPal stops retrying.
    return NextResponse.json({ ignored: event.event_type });
  }

  // `sender_item_id` is the submission uuid we set when creating the payout.
  const submissionId: string | undefined = event.resource?.payout_item?.sender_item_id;
  if (!submissionId) {
    console.warn("[paypal-webhook] no sender_item_id on", event.event_type);
    return NextResponse.json({ ignored: "no sender_item_id" });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("trade_in_submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (error || !data) {
    console.warn("[paypal-webhook] unknown submission", submissionId);
    return NextResponse.json({ ignored: "unknown submission" });
  }

  const submission = data as TradeInSubmission;

  // Idempotent: PayPal delivers webhooks at-least-once, and the reconcile button
  // may have already settled this payout.
  if (submission.payout_status === status) {
    return NextResponse.json({ ok: true, alreadyApplied: true });
  }
  if (submission.payout_status === "paid") {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  const settled = status === "paid";
  const paidAt = settled ? new Date().toISOString() : null;

  const { error: updateError } = await supabase
    .from("trade_in_submissions")
    .update({
      payout_status: status,
      paid_at: paidAt,
      ...(settled ? { status: "paid" } : {}),
      ...(status === "failed" ? { payout_error: `PayPal reported ${event.event_type}` } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (updateError) {
    console.error("[paypal-webhook] update failed:", updateError);
    // Non-2xx so PayPal retries.
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  await supabase.from("trade_in_events").insert({
    submission_id: submissionId,
    event_type: `payout_${status}`,
    note: `PayPal webhook: ${event.event_type}`,
    actor_email: "paypal-webhook",
  });

  if (settled && submission.customer_email) {
    try {
      await sendTradeInPaidEmail({
        to: submission.customer_email,
        customerName: submission.customer_name ?? "",
        productName: submission.product_name,
        price: Number(submission.payout_amount ?? submission.revised_price ?? submission.quoted_price ?? 0),
        paymentMethod: submission.payment_method,
        reference: submission.payout_reference,
        message: submission.payout_message,
        paidAt,
      });
    } catch (emailError) {
      console.error("[paypal-webhook] paid email failed:", emailError);
    }
  }

  return NextResponse.json({ ok: true, status });
}
