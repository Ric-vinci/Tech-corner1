import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendTradeInPaidEmail } from "@/lib/email/trade-in";
import { checkPaypalPayout, paypalBatchId, PayoutError } from "@/lib/payout";
import type { TradeInSubmission } from "@/lib/trade-in/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Re-check a payout that the provider hadn't settled when it was issued.
 *
 * PayPal payouts are asynchronous — a 201 means "accepted", not "paid". Rather
 * than block an HTTP request for a minute, we store `processing` and resolve it
 * here (from a button now; from the PAYOUTS-ITEM webhook later).
 */
export async function POST(_request: Request, context: RouteContext) {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.from("trade_in_submissions").select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  const submission = data as TradeInSubmission;
  if (submission.payout_status !== "processing") {
    return NextResponse.json({ error: "This payout is not awaiting settlement." }, { status: 400 });
  }

  const batchId = submission.payout_reference ? paypalBatchId(submission.payout_reference) : null;
  if (!batchId) {
    return NextResponse.json({ error: "Only PayPal payouts can be reconciled." }, { status: 400 });
  }

  let status;
  try {
    status = await checkPaypalPayout(batchId);
  } catch (err) {
    const message = err instanceof PayoutError ? err.message : "Could not reach PayPal.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (status === "processing") {
    return NextResponse.json({ payout: { status }, message: "Still pending at PayPal." });
  }

  const settled = status === "paid";
  const paidAt = settled ? new Date().toISOString() : null;

  const { data: updated, error: updateError } = await supabase
    .from("trade_in_submissions")
    .update({
      payout_status: status,
      paid_at: paidAt,
      // Only advance the workflow once the money has actually landed.
      ...(settled ? { status: "paid" } : {}),
      ...(status === "failed" ? { payout_error: "PayPal reported the payout as failed." } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    console.error("[reconcile] update failed:", updateError);
    return NextResponse.json({ error: "Could not save the payout status." }, { status: 500 });
  }

  await supabase.from("trade_in_events").insert({
    submission_id: id,
    event_type: `payout_${status}`,
    note: `PayPal payout ${status} (${submission.payout_reference})`,
    actor_email: session.email,
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
      console.error("[reconcile] paid email failed:", emailError);
    }
  }

  return NextResponse.json({ submission: updated, payout: { status } });
}
