import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export type TradeInPayload = {
  shopifyProductId?: string;
  shopifyVariantId?: string;
  productName: string;
  productSlug?: string;
  condition: string;
  returnPack?: string;
  paymentMethod: string;
  quantity: number;
  quotedPrice: number;
  imei?: string;
  confirmAccount: boolean;
  confirmUnlocked: boolean;
  confirmPayment: boolean;
  customerEmail?: string;
  customerName?: string;
  payoutDetails?: Record<string, unknown>;
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Trade-in service not configured" }, { status: 503 });
  }

  let body: TradeInPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.productName || !body.condition || !body.paymentMethod || !body.customerEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customerEmail)) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }

  if (body.paymentMethod === "Bank Transfer") {
    const payout = body.payoutDetails as { accountName?: string; sortCode?: string; accountNumber?: string } | undefined;
    if (!payout?.accountName || !payout?.sortCode || !payout?.accountNumber) {
      return NextResponse.json({ error: "Please enter bank account details" }, { status: 400 });
    }
  }

  if (body.paymentMethod === "Paypal") {
    const payout = body.payoutDetails as { paypalEmail?: string } | undefined;
    if (!payout?.paypalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payout.paypalEmail)) {
      return NextResponse.json({ error: "Please enter a valid PayPal email address" }, { status: 400 });
    }
  }

  if (!body.confirmAccount || !body.confirmUnlocked || !body.confirmPayment) {
    return NextResponse.json({ error: "Please confirm all checkboxes" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("trade_in_submissions")
      .insert({
        shopify_product_id: body.shopifyProductId ?? null,
        shopify_variant_id: body.shopifyVariantId ?? null,
        product_name: body.productName,
        product_slug: body.productSlug ?? null,
        condition: body.condition,
        return_pack: body.returnPack ?? null,
        payment_method: body.paymentMethod,
        quantity: body.quantity,
        quoted_price: body.quotedPrice,
        imei: body.imei ?? null,
        confirm_account: body.confirmAccount,
        confirm_unlocked: body.confirmUnlocked,
        confirm_payment: body.confirmPayment,
        customer_email: body.customerEmail ?? null,
        customer_name: body.customerName ?? null,
        payout_details: body.payoutDetails ?? null,
        status: "submitted",
      })
      .select("id")
      .single();

    if (error) throw error;

    await supabase.from("trade_in_events").insert({
      submission_id: data.id,
      event_type: "submitted",
      note: "Customer submitted trade-in form",
    });

    return NextResponse.json({ success: true, submissionId: data.id });
  } catch (error) {
    console.error("[trade-in] insert failed:", error);
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }
}
