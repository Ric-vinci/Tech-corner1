import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  canTransitionStatus,
  isTradeInStatus,
  type TradeInStatus,
} from "@/lib/trade-in/status";
import type { TradeInSubmission } from "@/lib/trade-in/types";
import { createShopifyInventoryFromTradeIn } from "@/lib/trade-in/shopify-inventory";
import {
  sendTradeInAcceptedEmail,
  sendTradeInPaidEmail,
  sendTradeInReceivedEmail,
  sendTradeInRejectedEmail,
  sendTradeInRevisedOfferEmail,
  sendTradeInReturnPackEmail,
} from "@/lib/email/trade-in";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Notify the customer on the two status changes they care about. Email delivery
 * must never fail an admin action that is already persisted.
 */
async function sendCustomerStatusEmail(
  status: TradeInStatus | undefined,
  submission: TradeInSubmission,
) {
  if (!status || !submission.customer_email) return;
  const price = Number(submission.revised_price ?? submission.quoted_price ?? 0);
  const to = submission.customer_email;
  const customerName = submission.customer_name ?? "";
  const productName = submission.product_name;
  const reason = submission.admin_notes;

  try {
    switch (status) {
      case "awaiting_shipment":
        await sendTradeInReturnPackEmail({ to, customerName, productName });
        break;
      case "received":
        await sendTradeInReceivedEmail({ to, customerName, productName });
        break;
      case "revised_offer":
        await sendTradeInRevisedOfferEmail({ to, customerName, productName, price, reason });
        break;
      case "rejected":
        await sendTradeInRejectedEmail({ to, customerName, productName, reason });
        break;
      case "accepted":
        await sendTradeInAcceptedEmail({
          to,
          customerName,
          productName,
          price,
          paymentMethod: submission.payment_method,
        });
        break;
      case "paid":
        // The payout route already emails the customer (and it alone knows the
        // gift card code). Only email here when the status was flipped manually.
        if (submission.payout_reference) return;
        await sendTradeInPaidEmail({
          to,
          customerName,
          productName,
          price,
          paymentMethod: submission.payment_method,
          reference: submission.payout_reference,
        });
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`[admin/trade-in] ${status} email failed:`, err);
  }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const supabase = getSupabaseAdmin();

  const [{ data: submission, error }, { data: events, error: eventsError }] = await Promise.all([
    supabase.from("trade_in_submissions").select("*").eq("id", id).single(),
    supabase
      .from("trade_in_events")
      .select("*")
      .eq("submission_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (error || !submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }
  if (eventsError) {
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }

  return NextResponse.json({ submission, events: events ?? [] });
}

type PatchBody = {
  status?: TradeInStatus;
  adminNotes?: string;
  trackingNumber?: string;
  revisedPrice?: number;
  payoutReference?: string;
  note?: string;
  // Inspection details (migration 006).
  inspection?: {
    grade?: string | null;
    batteryHealth?: number | null;
    colour?: string | null;
    storage?: string | null;
    imei?: string | null;
    photos?: string[] | null;
    notes?: string | null;
  };
};

export async function PATCH(request: Request, context: RouteContext) {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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

  const currentStatus = existing.status as TradeInStatus;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.adminNotes !== undefined) updates.admin_notes = body.adminNotes;
  if (body.trackingNumber !== undefined) updates.tracking_number = body.trackingNumber;
  if (body.payoutReference !== undefined) updates.payout_reference = body.payoutReference;
  if (body.revisedPrice !== undefined) updates.revised_price = body.revisedPrice;

  let eventType = "updated";
  let eventNote = body.note ?? "Admin updated submission";

  // Inspection details — stamped with who inspected and when.
  const insp = body.inspection;
  if (insp) {
    if (insp.grade !== undefined) updates.grade = insp.grade;
    if (insp.batteryHealth !== undefined) updates.battery_health = insp.batteryHealth;
    if (insp.colour !== undefined) updates.colour = insp.colour;
    if (insp.storage !== undefined) updates.storage = insp.storage;
    if (insp.imei !== undefined) updates.imei = insp.imei;
    if (insp.photos !== undefined) updates.inspection_photos = insp.photos;
    if (insp.notes !== undefined) updates.inspection_notes = insp.notes;
    updates.inspected_at = new Date().toISOString();
    updates.inspected_by = session.email;
    eventType = "inspection";
    eventNote = body.note ?? "Inspection details updated";
  }

  if (body.status) {
    if (!isTradeInStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (!canTransitionStatus(currentStatus, body.status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${currentStatus} to ${body.status}` },
        { status: 400 },
      );
    }
    updates.status = body.status;
    eventType = `status_${body.status}`;
    eventNote = body.note ?? `Status changed to ${body.status}`;
  }

  const { data: submission, error: updateError } = await supabase
    .from("trade_in_submissions")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    console.error("[admin/trade-in] update failed:", updateError);
    const missingColumn = updateError.message?.includes("column");
    if (missingColumn) {
      return NextResponse.json(
        {
          error:
            "Database schema is out of date. Run the latest supabase/migrations/*.sql (e.g. 006_inspection_details.sql) in the Supabase SQL Editor.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }

  // Shopify inventory is created only AFTER the status is safely persisted, so a
  // database failure can never leave an orphaned draft product. productSet is
  // keyed on a deterministic handle, so a retry updates rather than duplicates.
  const warnings: string[] = [];
  if (body.status === "accepted") {
    try {
      const inventoryProductId = await createShopifyInventoryFromTradeIn(submission as TradeInSubmission);
      if (inventoryProductId) {
        const { error: linkError } = await supabase
          .from("trade_in_submissions")
          .update({ shopify_inventory_product_id: inventoryProductId })
          .eq("id", id);

        if (linkError) {
          warnings.push(
            "Shopify draft product created, but it could not be linked to the submission (run migration 002).",
          );
          console.error("[admin/trade-in] link inventory id failed:", linkError);
        } else {
          (submission as TradeInSubmission).shopify_inventory_product_id = inventoryProductId;
          eventNote += " — Shopify draft inventory product created";
        }
      }
    } catch (err) {
      console.error("[admin/trade-in] inventory create failed:", err);
      warnings.push(
        err instanceof Error ? err.message : "Failed to create Shopify inventory product",
      );
    }
  }

  await sendCustomerStatusEmail(body.status, submission as TradeInSubmission);

  const eventRow: Record<string, unknown> = {
    submission_id: id,
    event_type: eventType,
    note: eventNote,
    actor_email: session.email,
  };
  const { error: eventError } = await supabase.from("trade_in_events").insert(eventRow);
  if (eventError?.message?.includes("actor_email")) {
    await supabase.from("trade_in_events").insert({
      submission_id: id,
      event_type: eventType,
      note: eventNote,
    });
  } else if (eventError) {
    console.error("[admin/trade-in] event insert failed:", eventError);
  }

  const { data: events } = await supabase
    .from("trade_in_events")
    .select("*")
    .eq("submission_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    submission,
    events: events ?? [],
    ...(warnings.length ? { warnings } : {}),
  });
}
