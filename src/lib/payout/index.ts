import "server-only";
import { payViaBank } from "./bank";
import { payViaGiftCard } from "./gift-card";
import { payViaPaypal } from "./paypal";
import { PayoutError, type PayoutProviderId, type PayoutRequest, type PayoutResult } from "./types";

export * from "./types";
export { readBankDetails } from "./bank";
export {
  isPaypalConfigured,
  checkPaypalPayout,
  paypalBatchId,
  statusFromWebhookEvent,
  verifyWebhookSignature,
} from "./paypal";

/**
 * Map the customer's chosen payment method onto a payout rail. Historic rows use
 * mixed casing ("Paypal", "paypal", "Bank Transfer", "bank"), so match loosely.
 */
export function resolveProvider(paymentMethod: string): PayoutProviderId {
  const value = paymentMethod.toLowerCase();
  if (value.includes("paypal")) return "paypal";
  if (value.includes("bank")) return "bank";
  if (value.includes("gift") || value.includes("credit") || value.includes("voucher")) return "gift_card";
  throw new PayoutError(`No payout rail for payment method "${paymentMethod}".`);
}

export async function issuePayout(
  provider: PayoutProviderId,
  request: PayoutRequest,
): Promise<PayoutResult> {
  switch (provider) {
    case "gift_card":
      return payViaGiftCard(request);
    case "bank":
      return payViaBank(request);
    case "paypal":
      return payViaPaypal(request);
    default:
      throw new PayoutError(`Unknown payout provider "${provider}".`);
  }
}
