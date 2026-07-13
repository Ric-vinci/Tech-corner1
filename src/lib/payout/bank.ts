import "server-only";
import { PayoutError, type PayoutRequest, type PayoutResult } from "./types";

/**
 * Bank transfers are not automated. No UK bank exposes a payments API to a
 * personal account, and every provider that does (Wise, Modulr, TrueLayer)
 * requires company onboarding.
 *
 * So this rail records a payment a human already made: staff pay from their
 * banking app (individually, or in bulk via the CSV export), then supply the
 * bank's reference here. Swapping in a real provider later only changes this
 * file — the interface, API route and UI stay the same.
 */
export async function payViaBank(request: PayoutRequest): Promise<PayoutResult> {
  const reference = request.reference?.trim();
  if (!reference) {
    throw new PayoutError("Enter the bank reference from your banking app before marking this as paid.");
  }

  return {
    provider: "bank",
    // Namespaced so it can never collide with a PayPal batch id or gift card gid.
    status: "paid",
    reference: `bank:${reference}`,
  };
}

export type BankDetails = {
  accountName?: string;
  sortCode?: string;
  accountNumber?: string;
};

export function readBankDetails(payoutDetails: Record<string, unknown> | null): BankDetails {
  const details = (payoutDetails ?? {}) as BankDetails;
  return {
    accountName: details.accountName,
    sortCode: details.sortCode,
    accountNumber: details.accountNumber,
  };
}
