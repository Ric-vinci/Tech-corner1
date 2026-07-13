import "server-only";
import { fetchSellProductFromShopify } from "@/lib/shopify/catalog";
import { bonusFor } from "@/lib/trade-in/bonus";

/**
 * The basket lives in localStorage, so every price in a checkout request is
 * attacker-controlled. Re-derive the quote from Shopify (the catalogue is the
 * source of truth for what a device is worth) before writing it to the database.
 */
function priceForCondition(
  product: { priceWorking?: number; priceFaulty?: number; priceNoPower?: number },
  condition: string,
): number | null {
  const key = condition.toLowerCase();
  if (key.includes("faulty")) return product.priceFaulty ?? null;
  if (key.includes("no power")) return product.priceNoPower ?? null;
  if (key.includes("working")) return product.priceWorking ?? null;
  return null;
}

export type QuoteInput = {
  productSlug: string;
  condition: string;
  quantity: number;
  paymentMethod: string;
  /** Only used if Shopify can't price the device (e.g. static fallback mode). */
  clientUnitPrice: number;
};

export type Quote = {
  unitPrice: number;
  bonus: number;
  total: number;
  /** True when we had to fall back to the client's price. */
  unverified: boolean;
};

export async function quoteForItem(item: QuoteInput): Promise<Quote> {
  let unitPrice: number | null = null;

  try {
    const product = await fetchSellProductFromShopify(item.productSlug);
    if (product) unitPrice = priceForCondition(product, item.condition);
  } catch (error) {
    console.error(`[pricing] Shopify lookup failed for "${item.productSlug}":`, error);
  }

  const unverified = unitPrice == null;
  let verifiedUnitPrice: number;

  if (unitPrice == null) {
    console.warn(
      `[pricing] could not price "${item.productSlug}" (${item.condition}) from Shopify — ` +
        `falling back to the submitted price of £${item.clientUnitPrice}`,
    );
    verifiedUnitPrice = Math.max(0, Number(item.clientUnitPrice) || 0);
  } else {
    verifiedUnitPrice = unitPrice;
    if (Math.abs(unitPrice - item.clientUnitPrice) > 0.001) {
      console.warn(
        `[pricing] submitted price £${item.clientUnitPrice} for "${item.productSlug}" ` +
          `does not match Shopify's £${unitPrice} — using Shopify's.`,
      );
    }
  }

  const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
  const bonus = bonusFor(item.paymentMethod, verifiedUnitPrice); // per phone

  return {
    unitPrice: verifiedUnitPrice,
    bonus,
    total: (verifiedUnitPrice + bonus) * quantity, // bonus applies to every phone
    unverified,
  };
}
