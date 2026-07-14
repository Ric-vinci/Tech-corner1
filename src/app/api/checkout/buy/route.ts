import { NextResponse } from "next/server";
import { requireCustomerSession } from "@/lib/customer/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { adminRequest, isShopifyAdminConfigured } from "@/lib/shopify/admin-client";
import { normalizeShippingAddress, validateShippingAddress } from "@/lib/checkout/shipping-address";
import { createPaypalOrder, isPaypalConfigured } from "@/lib/buy-payment/paypal";
import { redeemStoreCredit, redeemByCode } from "@/lib/buy-payment/store-credit";
import { markRefurbUnitsSold } from "@/lib/shopify/admin-inventory";
import type { BuyCartItem } from "@/lib/cart/buy-cart";

type Method = "bank" | "paypal" | "gift_card";

/**
 * Re-derive each line price from Shopify (the basket is client-side / tamperable)
 * and capture the owning product id so the unit can be marked sold on purchase.
 */
async function serverPrices(variantIds: string[]): Promise<Map<string, { price: number; productId: string | null }>> {
  const map = new Map<string, { price: number; productId: string | null }>();
  if (!variantIds.length || !isShopifyAdminConfigured()) return map;
  try {
    const data = await adminRequest<{ nodes: ({ id: string; price: string; product: { id: string } | null } | null)[] }>(
      `query($ids: [ID!]!) { nodes(ids: $ids) { ... on ProductVariant { id price product { id } } } }`,
      { ids: variantIds },
      { noStore: true },
    );
    for (const n of data.nodes) if (n?.id) map.set(n.id, { price: parseFloat(n.price), productId: n.product?.id ?? null });
  } catch {
    /* fall back to client price */
  }
  return map;
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireCustomerSession();
  } catch {
    return NextResponse.json({ error: "Please sign in to check out." }, { status: 401 });
  }

  let body: { items?: BuyCartItem[]; shippingAddress?: Record<string, unknown>; method?: Method; giftCardCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const items = body.items ?? [];
  const method: Method = body.method ?? "bank";
  if (!items.length) return NextResponse.json({ error: "Your basket is empty." }, { status: 400 });

  const shippingAddress = normalizeShippingAddress(body.shippingAddress ?? {});
  const addressError = validateShippingAddress(shippingAddress);
  if (addressError) return NextResponse.json({ error: addressError }, { status: 400 });

  // Authoritative prices from Shopify; never trust the client total.
  const prices = await serverPrices(items.map((i) => i.variantId).filter(Boolean) as string[]);
  const lines = items.map((i) => {
    const derived = i.variantId ? prices.get(i.variantId) : undefined;
    const unit = derived?.price ?? i.price;
    return { ...i, price: unit, lineTotal: unit * i.quantity };
  });
  const total = lines.reduce((s, l) => s + l.lineTotal, 0);
  // Units to mark sold (archive) once the order is committed — one physical unit
  // per product, so buying it removes it from stock and, when it's the model's
  // last unit, the storefront flips to "Notify when in stock".
  const soldProductIds = items
    .map((i) => ({ productId: i.variantId ? prices.get(i.variantId)?.productId ?? null : null, qty: i.quantity }))
    .filter((u): u is { productId: string; qty: number } => Boolean(u.productId));
  const supabase = getSupabaseAdmin();

  const baseRow = {
    customer_id: session.customerId,
    customer_email: session.email,
    shipping_address: shippingAddress,
    items: lines,
    total,
    payment_method: method,
  };

  // ---- Store credit: two secure paths, both debit real Shopify gift cards
  // before the order is created. A typed one-time CODE is matched against the
  // HMAC registry; otherwise the customer's OWN issued cards (by customer id).
  if (method === "gift_card") {
    if (!isShopifyAdminConfigured()) return NextResponse.json({ error: "Store credit is unavailable." }, { status: 400 });
    const code = body.giftCardCode?.trim();
    const result = code ? await redeemByCode(code, total) : await redeemStoreCredit(session.customerId, total);
    if (!result.ok) return NextResponse.json({ error: result.error ?? "Store credit could not be redeemed." }, { status: 400 });

    const { data, error } = await insertOrder(supabase, {
      ...baseRow,
      status: "paid",
      payment_status: "paid",
      payment_reference: result.references.join(","),
      paid_at: new Date().toISOString(),
    });
    if (error || !data) return schemaError(error);
    await markRefurbUnitsSold(soldProductIds); // paid in full — remove from stock
    return NextResponse.json({ orderId: data.id, method, paid: true });
  }

  // ---- Bank transfer: order awaits a manual payment.
  if (method === "bank") {
    const { data, error } = await insertOrder(supabase, { ...baseRow, status: "awaiting_payment", payment_status: "pending" });
    if (error || !data) return schemaError(error);
    await markRefurbUnitsSold(soldProductIds); // reserve the unit so it can't be double-sold
    return NextResponse.json({ orderId: data.id, method });
  }

  // ---- PayPal: create the order, then hand off to PayPal for approval + capture.
  if (!isPaypalConfigured()) return NextResponse.json({ error: "PayPal is not configured." }, { status: 400 });
  const { data, error } = await insertOrder(supabase, { ...baseRow, status: "pending_payment", payment_status: "pending" });
  if (error || !data) return schemaError(error);
  await markRefurbUnitsSold(soldProductIds); // reserve during the approval window

  try {
    const origin = new URL(request.url).origin;
    const paypal = await createPaypalOrder({
      amount: total,
      referenceId: data.id,
      returnUrl: `${origin}/api/checkout/buy/paypal/return?order=${data.id}`,
      cancelUrl: `${origin}/buy-used/checkout?cancelled=1`,
    });
    await supabase.from("buy_orders").update({ payment_reference: paypal.paypalOrderId, updated_at: new Date().toISOString() }).eq("id", data.id);
    return NextResponse.json({ orderId: data.id, method, approveUrl: paypal.approveUrl });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not start PayPal payment." }, { status: 500 });
  }
}

type Insert = Record<string, unknown>;
async function insertOrder(supabase: ReturnType<typeof getSupabaseAdmin>, row: Insert) {
  return supabase.from("buy_orders").insert(row).select("id").single();
}

function schemaError(error: { message?: string } | null) {
  console.error("[checkout/buy] insert failed:", error);
  const missing = error?.message?.includes("buy_orders") || error?.message?.includes("column") || error?.message?.includes("relation");
  return NextResponse.json(
    { error: missing ? "Run supabase/migrations/008 + 009 in Supabase." : "Could not place your order." },
    { status: 500 },
  );
}
