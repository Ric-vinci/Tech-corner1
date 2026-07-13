import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendTradeInPaidEmail } from "@/lib/email/trade-in";
import { recordIssuedGiftCard } from "@/lib/gift-cards/registry";
import {
  issuePayout,
  resolveProvider,
  PayoutError,
  PAYOUT_PROVIDERS,
  type PayoutProviderId,
} from "@/lib/payout";
import type { TradeInSubmission } from "@/lib/trade-in/types";

type RouteContext = { params: Promise<{ id: string }> };

type Body = {
  /** Override the rail derived from the customer's payment method. */
  provider?: PayoutProviderId;
  /** Bank rail: the reference from the staff member's banking app. */
  reference?: string;
  /** Optional note included in the customer's email. */
  message?: string;
};

const CURRENCY = "GBP";

export async function POST(request: Request, context: RouteContext) {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: Body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: loadError } = await supabase
    .from("trade_in_submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (loadError || !existing) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }
  const submission = existing as TradeInSubmission;

  // --- Guards -------------------------------------------------------------
  // A payout the provider hasn't settled yet must be reconciled, not re-sent.
  // Checked first: an in-flight payout also has a reference, so the "already paid"
  // guard below would otherwise report it with the wrong message.
  if (submission.payout_status === "processing") {
    return NextResponse.json(
      { error: "A payout is already in flight. Check its status instead of sending another." },
      { status: 409 },
    );
  }
  // Never pay twice. Checked before the status guard so a second attempt reports
  // "already paid" rather than the confusing "status is already paid". The DB also
  // enforces this via a unique partial index on payout_reference.
  if (submission.payout_reference || submission.payout_status === "paid") {
    return NextResponse.json(
      { error: "This submission has already been paid.", reference: submission.payout_reference },
      { status: 409 },
    );
  }
  // Only an accepted device may be paid.
  if (submission.status !== "accepted") {
    return NextResponse.json(
      { error: `Only accepted submissions can be paid (this one is "${submission.status}").` },
      { status: 400 },
    );
  }

  let provider: PayoutProviderId;
  try {
    provider = body.provider && PAYOUT_PROVIDERS.includes(body.provider)
      ? body.provider
      : resolveProvider(submission.payment_method);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown rail" }, { status: 400 });
  }

  // The amount is always recomputed here — never taken from the request body.
  const amount = Number(submission.revised_price ?? submission.quoted_price ?? 0);
  if (!(amount > 0)) {
    return NextResponse.json({ error: "Payout amount must be greater than zero." }, { status: 400 });
  }

  // --- Record intent BEFORE calling the provider ---------------------------
  // If the process dies mid-call we still know money may have moved.
  const { error: markError } = await supabase
    .from("trade_in_submissions")
    .update({
      payout_provider: provider,
      payout_status: "processing",
      payout_amount: amount,
      payout_message: body.message ?? null,
      payout_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (markError) {
    console.error("[payout] failed to mark processing:", markError);
    const missingColumn = markError.message?.includes("column");
    return NextResponse.json(
      {
        error: missingColumn
          ? "Database schema is out of date. Run supabase/migrations/005_payouts.sql."
          : "Could not start the payout.",
      },
      { status: 500 },
    );
  }

  // --- Call the provider ---------------------------------------------------
  try {
    const result = await issuePayout(provider, {
      submissionId: submission.id,
      amount,
      currency: CURRENCY,
      customerEmail: submission.customer_email ?? "",
      customerName: submission.customer_name ?? "",
      productName: submission.product_name,
      payoutDetails: submission.payout_details,
      message: body.message,
      reference: body.reference,
    });

    const settled = result.status === "paid";
    const paidAt = settled ? new Date().toISOString() : null;

    const { data: updated, error: updateError } = await supabase
      .from("trade_in_submissions")
      .update({
        payout_reference: result.reference,
        payout_status: result.status,
        payout_provider: result.provider,
        paid_at: paidAt,
        // Only advance the workflow once the money has actually landed.
        ...(settled ? { status: "paid" } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    // Register a gift-card payout so its one-time code can be redeemed at buy
    // checkout (we store an HMAC of the code, never the plaintext).
    if (result.provider === "gift_card" && result.giftCardCode && result.reference) {
      await recordIssuedGiftCard({
        gid: result.reference,
        code: result.giftCardCode,
        customerId: submission.customer_id,
        submissionId: id,
        amount,
      });
    }

    await supabase.from("trade_in_events").insert({
      submission_id: id,
      event_type: `payout_${result.status}`,
      note: `${provider} payout of £${amount.toFixed(2)} — ${result.status} (${result.reference})`,
      actor_email: session.email,
    });

    // Email the customer. Delivery must never fail a payout that already happened.
    if (settled && submission.customer_email) {
      try {
        await sendTradeInPaidEmail({
          to: submission.customer_email,
          customerName: submission.customer_name ?? "",
          productName: submission.product_name,
          price: amount,
          paymentMethod: submission.payment_method,
          reference: result.reference,
          message: body.message,
          giftCardCode: result.giftCardCode,
          paidAt,
        });
      } catch (emailError) {
        console.error("[payout] paid email failed:", emailError);
      }
    }

    return NextResponse.json({
      submission: updated,
      payout: { provider: result.provider, status: result.status, reference: result.reference },
      // Shown once in the UI — Shopify never reveals the code again.
      giftCardCode: result.giftCardCode ?? null,
    });
  } catch (err) {
    const message = err instanceof PayoutError ? err.message : "Payout failed. Please try again.";
    console.error("[payout] provider failed:", err);

    await supabase
      .from("trade_in_submissions")
      .update({ payout_status: "failed", payout_error: message, updated_at: new Date().toISOString() })
      .eq("id", id);

    await supabase.from("trade_in_events").insert({
      submission_id: id,
      event_type: "payout_failed",
      note: message,
      actor_email: session.email,
    });

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
