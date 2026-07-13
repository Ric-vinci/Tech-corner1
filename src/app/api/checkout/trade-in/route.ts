import { NextResponse } from "next/server";
import { normalizeShippingAddress, validateShippingAddress } from "@/lib/checkout/shipping-address";
import type { ShippingAddress } from "@/lib/checkout/shipping-address";
import { requireCustomerSession } from "@/lib/customer/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendTradeInConfirmationEmail } from "@/lib/email/trade-in";
import { quoteForItem, type Quote } from "@/lib/trade-in/pricing";
import { categoryFromSellHref } from "@/lib/admin/categories";
import type { TradeInCartItem } from "@/lib/cart/trade-in-cart";

export async function POST(request: Request) {
  let session;
  try {
    session = await requireCustomerSession();
  } catch {
    return NextResponse.json({ error: "Please sign in to complete checkout" }, { status: 401 });
  }

  let body: { items?: TradeInCartItem[]; shippingAddress?: Partial<ShippingAddress> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items = body.items ?? [];
  if (!items.length) {
    return NextResponse.json({ error: "Your basket is empty" }, { status: 400 });
  }

  const shippingAddress = normalizeShippingAddress(body.shippingAddress ?? {});
  const addressError = validateShippingAddress(shippingAddress);
  if (addressError) {
    return NextResponse.json({ error: addressError }, { status: 400 });
  }

  const customerName = `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim();
  const supabase = getSupabaseAdmin();
  const submissionIds: string[] = [];
  const quotes: Quote[] = [];

  try {
    await supabase
      .from("customers")
      .update({
        first_name: shippingAddress.firstName,
        last_name: shippingAddress.lastName,
        phone: shippingAddress.telephone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.customerId);

    for (const item of items) {
      // The basket lives in localStorage, so its prices are attacker-controlled.
      // Re-derive the quote from Shopify and add the store-credit bonus here —
      // never trust item.unitPrice. The bonus is deliberately not shown on the
      // product page (see lib/trade-in/bonus.ts).
      const quote = await quoteForItem({
        productSlug: item.productSlug,
        condition: item.condition,
        quantity: item.quantity,
        paymentMethod: item.paymentMethod,
        clientUnitPrice: item.unitPrice,
      });
      quotes.push(quote);

      const insertPayload: Record<string, unknown> = {
        shopify_product_id: item.shopifyProductId ?? null,
        shopify_variant_id: item.shopifyVariantId ?? null,
        product_name: item.productName,
        product_slug: item.productSlug,
        category: categoryFromSellHref(item.productHref),
        condition: item.condition,
        return_pack: item.returnPack,
        payment_method: item.paymentMethod,
        quantity: item.quantity,
        quoted_price: quote.total,
        imei: item.imei ?? null,
        confirm_account: item.confirmAccount,
        confirm_unlocked: item.confirmUnlocked,
        confirm_payment: item.confirmPayment,
        customer_email: session.email,
        customer_name: customerName,
        customer_phone: shippingAddress.telephone,
        shipping_address: shippingAddress,
        // Keep the base per-unit price (excludes the store-credit bonus) so the
        // resale price is anchored to the device value, not the inflated payout.
        payout_details: { ...(item.payoutDetails ?? {}), base_unit_price: quote.unitPrice },
        status: "submitted",
      };

      insertPayload.customer_id = session.customerId;

      const { data, error } = await supabase
        .from("trade_in_submissions")
        .insert(insertPayload)
        .select("id")
        .single();

      if (error) {
        const fallback = { ...insertPayload };
        delete fallback.customer_id;
        delete fallback.customer_phone;
        delete fallback.shipping_address;
        delete fallback.category; // pre-migration-007 schema

        const retry = await supabase
          .from("trade_in_submissions")
          .insert({
            ...fallback,
            customer_email: session.email,
            customer_name: customerName,
            payout_details: {
              ...item.payoutDetails,
              shippingAddress,
              telephone: shippingAddress.telephone,
            },
          })
          .select("id")
          .single();

        if (retry.error) throw retry.error;
        submissionIds.push(retry.data.id);
      } else {
        submissionIds.push(data.id);
      }

      const submissionId = submissionIds[submissionIds.length - 1];
      await supabase.from("trade_in_events").insert({
        submission_id: submissionId,
        event_type: "submitted",
        note: `Customer completed checkout — ${shippingAddress.city}, ${shippingAddress.countryName}`,
      });
    }

    // Confirmation + shipping instructions. Delivery problems must never fail a
    // trade-in that is already persisted, so failures are logged, not thrown.
    try {
      await sendTradeInConfirmationEmail({
        to: session.email,
        customerName: customerName,
        items: items.map((item, index) => ({
          id: submissionIds[index] ?? "",
          productName: item.productName,
          price: quotes[index]?.total ?? 0,
          condition: item.condition,
          paymentMethod: item.paymentMethod,
        })),
      });
    } catch (emailError) {
      console.error("[checkout/trade-in] confirmation email failed:", emailError);
    }

    return NextResponse.json({ success: true, submissionIds });
  } catch (error) {
    console.error("[checkout/trade-in] failed:", error);
    return NextResponse.json({ error: "Checkout failed. Please try again." }, { status: 500 });
  }
}
