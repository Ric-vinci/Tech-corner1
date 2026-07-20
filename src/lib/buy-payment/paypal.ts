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
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Idempotency: keyed on our buy_order id, so a retried create returns the
      // SAME PayPal order instead of a second one the customer could also pay.
      "PayPal-Request-Id": `buy-order-${opts.referenceId}`,
    },
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

/**
 * Capture an approved PayPal order. Returns the capture id when COMPLETED.
 *
 * Idempotent in two layers, because the browser return URL and the webhook can
 * both try to capture the same order at once:
 *  - PayPal-Request-Id makes a replayed request return the original capture
 *    rather than taking the money twice;
 *  - if PayPal still reports ORDER_ALREADY_CAPTURED, we read the existing
 *    capture back and report success, since the money HAS been taken.
 */
export async function capturePaypalOrder(paypalOrderId: string): Promise<{ captured: boolean; captureId: string | null }> {
  const token = await accessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `capture-${paypalOrderId}`,
    },
  });
  const json = await res.json();

  if (!res.ok) {
    const alreadyCaptured = JSON.stringify(json?.details ?? json ?? "").includes("ORDER_ALREADY_CAPTURED");
    if (alreadyCaptured) return readCapture(paypalOrderId, token);
    return { captured: false, captureId: null };
  }

  const capture = json?.purchase_units?.[0]?.payments?.captures?.[0];
  return { captured: json.status === "COMPLETED", captureId: capture?.id ?? null };
}

/** Read an already-captured order back, so a duplicate capture still resolves. */
async function readCapture(paypalOrderId: string, token: string): Promise<{ captured: boolean; captureId: string | null }> {
  try {
    const res = await fetch(`${apiBase()}/v2/checkout/orders/${paypalOrderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    const capture = json?.purchase_units?.[0]?.payments?.captures?.[0];
    return { captured: capture?.status === "COMPLETED", captureId: capture?.id ?? null };
  } catch {
    return { captured: false, captureId: null };
  }
}
