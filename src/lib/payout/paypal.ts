import "server-only";
import { PayoutError, type PayoutRequest, type PayoutResult, type PayoutStatus } from "./types";

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
  if (!json.access_token) {
    throw new PayoutError(`PayPal auth failed: ${json.error_description ?? json.error ?? res.status}`);
  }

  cachedToken = { value: json.access_token, expiresAt: Date.now() + Number(json.expires_in ?? 0) * 1000 };
  return cachedToken.value;
}

/** PayPal item states -> our payout status. */
function mapStatus(transactionStatus: string | undefined): PayoutStatus {
  switch (transactionStatus) {
    case "SUCCESS":
      return "paid";
    case "UNCLAIMED":
      return "unclaimed";
    case "FAILED":
    case "DENIED":
    case "RETURNED":
    case "BLOCKED":
    case "REFUNDED":
      return "failed";
    default:
      return "processing";
  }
}

function receiverEmail(request: PayoutRequest): string {
  const details = (request.payoutDetails ?? {}) as { paypalEmail?: string };
  const email = details.paypalEmail?.trim() || request.customerEmail;
  if (!email) throw new PayoutError("No PayPal email on this submission.");

  // Safety net: outside of live, never send money at a real customer address.
  // Every sandbox payout is redirected to the sandbox personal account.
  const sandboxReceiver = process.env.PAYPAL_SANDBOX_RECEIVER_EMAIL?.trim();
  if (process.env.PAYPAL_ENV !== "live" && sandboxReceiver) {
    if (sandboxReceiver !== email) {
      console.warn(`[paypal] sandbox: redirecting payout from ${email} to ${sandboxReceiver}`);
    }
    return sandboxReceiver;
  }

  return email;
}

/**
 * PayPal Payouts is asynchronous: a 201 means *accepted*, not *paid*. We poll
 * briefly for a terminal state; anything still pending is returned as
 * `processing` and can be reconciled later.
 *
 * `sender_batch_id` is the submission id, so PayPal itself rejects a replay with
 * BATCH_ID_ALREADY_EXISTS — double-paying is impossible even if our DB guard fails.
 */
export async function payViaPaypal(request: PayoutRequest): Promise<PayoutResult> {
  if (!isPaypalConfigured()) throw new PayoutError("PayPal is not configured.");

  const token = await accessToken();
  const senderBatchId = `tradein-${request.submissionId}`;

  const res = await fetch(`${apiBase()}/v1/payments/payouts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: senderBatchId,
        email_subject: "You've been paid by 4gadgets",
        email_message: request.message || `Payment for your trade-in: ${request.productName}.`,
      },
      items: [
        {
          recipient_type: "EMAIL",
          receiver: receiverEmail(request),
          amount: { value: request.amount.toFixed(2), currency: request.currency },
          note: `Trade-in payout for ${request.productName}`,
          sender_item_id: request.submissionId,
        },
      ],
    }),
  });

  const json = await res.json();
  if (res.status >= 400) {
    const detail = json.details?.[0]?.description ?? json.message ?? json.name ?? `HTTP ${res.status}`;
    throw new PayoutError(`PayPal rejected the payout: ${detail}`);
  }

  const batchId: string = json.batch_header.payout_batch_id;

  // Poll briefly for a terminal state (payouts usually settle in a few seconds).
  let status: PayoutStatus = "processing";
  for (let attempt = 0; attempt < 5; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const poll = await fetch(`${apiBase()}/v1/payments/payouts/${batchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const detail = await poll.json();
    status = mapStatus(detail.items?.[0]?.transaction_status);
    if (status !== "processing") break;
  }

  return { provider: "paypal", status, reference: `paypal:${batchId}` };
}

/** Extract the PayPal batch id from a stored payout reference (`paypal:<batchId>`). */
export function paypalBatchId(reference: string): string | null {
  return reference.startsWith("paypal:") ? reference.slice("paypal:".length) : null;
}

/** Map a PAYOUTS-ITEM.* webhook event name onto our payout status. */
export function statusFromWebhookEvent(eventType: string): PayoutStatus | null {
  switch (eventType) {
    case "PAYMENT.PAYOUTS-ITEM.SUCCEEDED":
      return "paid";
    case "PAYMENT.PAYOUTS-ITEM.UNCLAIMED":
      return "unclaimed";
    case "PAYMENT.PAYOUTS-ITEM.FAILED":
    case "PAYMENT.PAYOUTS-ITEM.DENIED":
    case "PAYMENT.PAYOUTS-ITEM.RETURNED":
    case "PAYMENT.PAYOUTS-ITEM.BLOCKED":
    case "PAYMENT.PAYOUTS-ITEM.REFUNDED":
      return "failed";
    default:
      return null;
  }
}

/**
 * Ask PayPal to verify the webhook signature. Anyone can POST to a public URL,
 * so an unverified payout webhook would let a stranger mark trade-ins as paid.
 */
export async function verifyWebhookSignature(headers: Headers, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.error("[paypal] PAYPAL_WEBHOOK_ID is not set — rejecting webhook");
    return false;
  }

  const required = [
    "paypal-auth-algo",
    "paypal-cert-url",
    "paypal-transmission-id",
    "paypal-transmission-sig",
    "paypal-transmission-time",
  ] as const;
  if (required.some((header) => !headers.get(header))) return false;

  const token = await accessToken();
  const res = await fetch(`${apiBase()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      // Must be the parsed body — PayPal re-serialises it for the digest.
      webhook_event: JSON.parse(rawBody),
    }),
  });

  const json = await res.json();
  return json.verification_status === "SUCCESS";
}

/**
 * Re-query a payout that was still `processing` when we created it. PayPal settles
 * asynchronously, so a payout can sit pending for longer than we're willing to
 * block an HTTP request for.
 */
export async function checkPaypalPayout(batchId: string): Promise<PayoutStatus> {
  if (!isPaypalConfigured()) throw new PayoutError("PayPal is not configured.");

  const token = await accessToken();
  const res = await fetch(`${apiBase()}/v1/payments/payouts/${batchId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (res.status >= 400) {
    throw new PayoutError(`PayPal lookup failed: ${json.message ?? json.name ?? res.status}`);
  }
  return mapStatus(json.items?.[0]?.transaction_status);
}
