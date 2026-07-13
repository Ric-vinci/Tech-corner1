import "server-only";

const apiBase = () =>
  process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

export function isPaypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const json = await res.json();
  if (!json.access_token) throw new Error(`PayPal auth failed: ${json.error_description ?? json.error ?? res.status}`);
  cachedToken = { value: json.access_token, expiresAt: Date.now() + Number(json.expires_in ?? 0) * 1000 };
  return cachedToken.value;
}

/** Create a PayPal Checkout order the customer approves; returns the approval URL. */
export async function createPaypalOrder(opts: {
  amount: number;
  referenceId: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ paypalOrderId: string; approveUrl: string }> {
  const token = await accessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: opts.referenceId,
          amount: { currency_code: "GBP", value: opts.amount.toFixed(2) },
        },
      ],
      application_context: {
        brand_name: "4gadgets",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
        return_url: opts.returnUrl,
        cancel_url: opts.cancelUrl,
      },
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.id) throw new Error(json.message ?? "Could not start PayPal payment.");
  const approve = (json.links as { rel: string; href: string }[] | undefined)?.find((l) => l.rel === "approve" || l.rel === "payer-action");
  if (!approve) throw new Error("PayPal did not return an approval link.");
  return { paypalOrderId: json.id, approveUrl: approve.href };
}

/** Capture an approved PayPal order. Returns the capture id when COMPLETED. */
export async function capturePaypalOrder(paypalOrderId: string): Promise<{ captured: boolean; captureId: string | null }> {
  const token = await accessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const json = await res.json();
  const capture = json?.purchase_units?.[0]?.payments?.captures?.[0];
  return { captured: json.status === "COMPLETED", captureId: capture?.id ?? null };
}
