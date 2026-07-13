import "server-only";
import { adminRequest, isShopifyAdminConfigured } from "@/lib/shopify/admin-client";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { findGiftCardGidByCode } from "@/lib/gift-cards/registry";

/**
 * Secure store credit. A customer's store credit = the Shopify gift cards WE
 * issued to THEM via trade-in payouts. We stored each card's gid as the
 * submission's `payout_reference`, so we look them up by `customer_id` (the
 * authenticated customer) — never by a code the user types. This avoids
 * Shopify's inability to validate a full gift-card code from a custom checkout,
 * and makes redemption unguessable: you can only spend credit issued to you.
 */

/** The gift-card gids we issued to this customer. */
async function customerGiftCardGids(customerId: string): Promise<string[]> {
  const { data } = await getSupabaseAdmin()
    .from("trade_in_submissions")
    .select("payout_reference")
    .eq("customer_id", customerId)
    .eq("payout_provider", "gift_card")
    .not("payout_reference", "is", null);
  return [...new Set((data ?? []).map((r) => r.payout_reference as string).filter((v) => v?.startsWith("gid://")))];
}

type Card = { gid: string; balance: number };

/** Current (enabled) balance of each of the customer's gift cards. */
async function customerCards(customerId: string): Promise<Card[]> {
  if (!isShopifyAdminConfigured()) return [];
  const gids = await customerGiftCardGids(customerId);
  if (!gids.length) return [];
  try {
    const data = await adminRequest<{
      nodes: ({ id: string; enabled: boolean; balance: { amount: string } } | null)[];
    }>(
      `query($ids: [ID!]!) { nodes(ids: $ids) { ... on GiftCard { id enabled balance { amount } } } }`,
      { ids: gids },
      { noStore: true },
    );
    return data.nodes
      .filter((n): n is { id: string; enabled: boolean; balance: { amount: string } } => Boolean(n?.enabled))
      .map((n) => ({ gid: n.id, balance: parseFloat(n.balance.amount) }))
      .filter((c) => c.balance > 0);
  } catch {
    return [];
  }
}

/** Total store credit available to a customer. */
export async function getStoreCreditBalance(customerId: string): Promise<number> {
  const cards = await customerCards(customerId);
  return Math.round(cards.reduce((s, c) => s + c.balance, 0) * 100) / 100;
}

/**
 * Debit `amount` from the customer's own gift cards (largest first). Returns the
 * debited gift-card references. Fails (debiting nothing) if the balance can't
 * cover the amount.
 */
export async function redeemStoreCredit(
  customerId: string,
  amount: number,
): Promise<{ ok: boolean; references: string[]; error?: string }> {
  const cards = (await customerCards(customerId)).sort((a, b) => b.balance - a.balance);
  return debitCards(cards, amount, `£${cards.reduce((s, c) => s + c.balance, 0).toFixed(2)}`);
}

/** Current enabled balance of a single gift card by gid. */
export async function getGiftCardBalance(gid: string): Promise<number | null> {
  if (!isShopifyAdminConfigured()) return null;
  try {
    const data = await adminRequest<{ giftCard: { enabled: boolean; balance: { amount: string } } | null }>(
      `query($id: ID!) { giftCard(id: $id) { enabled balance { amount } } }`,
      { id: gid },
      { noStore: true },
    );
    if (!data.giftCard?.enabled) return null;
    return parseFloat(data.giftCard.balance.amount);
  } catch {
    return null;
  }
}

/** Debit `amount` across the given cards (largest-first). Shared by store credit + code redemption. */
export async function debitCards(
  cards: Card[],
  amount: number,
  availableLabel?: string,
): Promise<{ ok: boolean; references: string[]; error?: string }> {
  const available = cards.reduce((s, c) => s + c.balance, 0);
  if (available + 1e-9 < amount) {
    return { ok: false, references: [], error: `Insufficient balance${availableLabel ? ` (${availableLabel} available)` : ""}.` };
  }
  const references: string[] = [];
  let remaining = amount;
  for (const card of [...cards].sort((a, b) => b.balance - a.balance)) {
    if (remaining <= 0.001) break;
    const debit = Math.min(card.balance, remaining);
    try {
      const res = await adminRequest<{ giftCardDebit: { userErrors: { message: string }[] } }>(
        `mutation Debit($id: ID!, $debitInput: GiftCardDebitInput!) {
          giftCardDebit(id: $id, debitInput: $debitInput) { userErrors { field message } }
        }`,
        { id: card.gid, debitInput: { debitAmount: { amount: debit.toFixed(2), currencyCode: "GBP" }, note: "4gadgets purchase" } },
        { noStore: true },
      );
      const errs = res.giftCardDebit.userErrors ?? [];
      if (errs.length) return { ok: false, references, error: errs.map((e) => e.message).join("; ") };
      references.push(card.gid);
      remaining -= debit;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gift card debit failed.";
      // The Shopify app needs the write_gift_card_transactions scope to debit.
      if (/access scope|Access denied|write_gift_card_transactions/i.test(msg)) {
        console.error("[store-credit] giftCardDebit denied — add the `write_gift_card_transactions` scope to the Shopify app.");
        return { ok: false, references, error: "Store credit isn't available right now. Please choose another payment method." };
      }
      // Best-effort: earlier debits already applied — surface the failure so staff can reconcile.
      return { ok: false, references, error: msg };
    }
  }
  return { ok: true, references };
}

/**
 * Redeem a one-time gift-card code (typed at checkout). Secure: the code is
 * matched against the HMAC registry to resolve the gid, the live Shopify balance
 * is checked, then the card is debited. A generic error is returned for both
 * "unknown code" and "insufficient balance" so nothing about which codes exist
 * is leaked.
 */
export async function redeemByCode(code: string, amount: number): Promise<{ ok: boolean; references: string[]; error?: string }> {
  const gid = await findGiftCardGidByCode(code);
  if (!gid) return { ok: false, references: [], error: "That gift card code isn't valid." };
  const balance = await getGiftCardBalance(gid);
  if (balance == null) return { ok: false, references: [], error: "That gift card code isn't valid." };
  if (balance + 1e-9 < amount) {
    return { ok: false, references: [], error: `Gift card balance (£${balance.toFixed(2)}) doesn't cover this order.` };
  }
  return debitCards([{ gid, balance }], amount);
}
