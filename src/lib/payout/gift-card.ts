import "server-only";
import { adminRequest, isShopifyAdminConfigured } from "@/lib/shopify/admin-client";
import { PayoutError, type PayoutRequest, type PayoutResult } from "./types";

const GIFT_CARD_CREATE = `
  mutation GiftCardCreate($input: GiftCardCreateInput!) {
    giftCardCreate(input: $input) {
      giftCard { id lastCharacters }
      giftCardCode
      userErrors { field message }
    }
  }
`;

type GiftCardCreateResponse = {
  giftCardCreate: {
    giftCard: { id: string; lastCharacters: string } | null;
    giftCardCode: string | null;
    userErrors: { field: string[] | null; message: string }[];
  };
};

/**
 * Store credit. The gift card is issued in the *store's* currency, so the shop
 * must be set to GBP — Shopify performs no conversion.
 *
 * The plaintext code is returned exactly once, at creation. We email it and
 * never persist it; only the gift card's gid is stored as the payout reference.
 */
export async function payViaGiftCard(request: PayoutRequest): Promise<PayoutResult> {
  if (!isShopifyAdminConfigured()) {
    throw new PayoutError("Shopify Admin API is not configured.");
  }

  const data = await adminRequest<GiftCardCreateResponse>(GIFT_CARD_CREATE, {
    input: {
      initialValue: request.amount.toFixed(2),
      note: `Trade-in payout for ${request.productName} (submission ${request.submissionId})`,
    },
  });

  const errors = data.giftCardCreate.userErrors ?? [];
  if (errors.length) {
    throw new PayoutError(`Shopify rejected the gift card: ${errors.map((e) => e.message).join("; ")}`);
  }

  const giftCard = data.giftCardCreate.giftCard;
  const code = data.giftCardCreate.giftCardCode;
  if (!giftCard || !code) {
    throw new PayoutError("Shopify did not return a gift card code.");
  }

  return {
    provider: "gift_card",
    status: "paid",
    reference: giftCard.id,
    giftCardCode: code,
  };
}
