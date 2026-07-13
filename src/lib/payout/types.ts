export const PAYOUT_PROVIDERS = ["gift_card", "bank", "paypal"] as const;
export type PayoutProviderId = (typeof PAYOUT_PROVIDERS)[number];

export const PAYOUT_PROVIDER_LABELS: Record<PayoutProviderId, string> = {
  gift_card: "Gift card (store credit)",
  bank: "Bank transfer",
  paypal: "PayPal",
};

/** `processing` means the provider accepted it but hasn't confirmed delivery. */
export type PayoutStatus = "processing" | "paid" | "failed" | "unclaimed";

export type PayoutRequest = {
  submissionId: string;
  /** Always recomputed on the server — never taken from the client. */
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  productName: string;
  payoutDetails: Record<string, unknown> | null;
  /** Optional note from staff, included in the customer's email. */
  message?: string;
  /** Bank rail only: the reference from the staff member's banking app. */
  reference?: string;
};

export type PayoutResult = {
  provider: PayoutProviderId;
  status: PayoutStatus;
  /** Unique per payout; stored on the submission and enforced unique in the DB. */
  reference: string;
  /** Gift card rail only — the code the customer redeems. Never persisted. */
  giftCardCode?: string;
  error?: string;
};

export class PayoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayoutError";
  }
}
