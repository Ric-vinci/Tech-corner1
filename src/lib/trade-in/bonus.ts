/**
 * Store-credit bonus.
 *
 * Gift cards are the only payout rail that costs nothing to run and needs no
 * human, so customers are paid extra to choose it. Per the spec the bonus is
 * shown at *checkout*, not on the product detail page.
 *
 * Configurable globally today; a per-product override belongs in the Pricing
 * admin when that lands.
 */
export const STORE_CREDIT_METHOD = "Store Credit";

/**
 * NEXT_PUBLIC_ so the checkout UI can display the bonus. It is not a secret, and
 * the server never trusts a client-supplied amount — it recomputes the total from
 * this same value, so a tampered request cannot inflate a payout.
 */
export function storeCreditBonus(): number {
  const raw = Number(process.env.NEXT_PUBLIC_TRADE_IN_STORE_CREDIT_BONUS ?? 15);
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

export function isStoreCredit(paymentMethod: string): boolean {
  const value = paymentMethod.toLowerCase();
  return value.includes("credit") || value.includes("gift") || value.includes("voucher");
}

/** Bonus applies once per submission (one device), not per unit. */
export function bonusFor(paymentMethod: string): number {
  return isStoreCredit(paymentMethod) ? storeCreditBonus() : 0;
}

/** The amount actually owed for a line: unit price × qty, plus any bonus. */
export function quotedTotal(unitPrice: number, quantity: number, paymentMethod: string): number {
  return unitPrice * quantity + bonusFor(paymentMethod);
}

/**
 * Default markup applied to a refurb unit's resale price when it's created, so
 * it never lists at zero margin. Percentage first, then a minimum flat markup —
 * e.g. cost £80 → max(80×1.30, 80+10) = £104. Staff can override per unit.
 */
export function refurbDefaultResalePrice(cost: number): number {
  const pct = Number(process.env.REFURB_DEFAULT_MARKUP_PCT ?? 30);
  const flat = Number(process.env.REFURB_DEFAULT_MARKUP_GBP ?? 10);
  const byPct = cost * (1 + (Number.isFinite(pct) ? pct : 30) / 100);
  const byFlat = cost + (Number.isFinite(flat) ? flat : 10);
  return Math.round(Math.max(byPct, byFlat) * 100) / 100;
}
