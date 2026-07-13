import type { ShippingAddress } from "@/lib/checkout/shipping-address";

/**
 * Remember the last checkout address in the browser (localStorage) so a returning
 * customer doesn't re-type it. Shared by the buy and sell checkout. Device-local
 * by design — no database, no migration.
 */
const KEY = "tc3-checkout-address";

export function saveCheckoutAddress(address: ShippingAddress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(address));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export function readCheckoutAddress(): ShippingAddress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ShippingAddress) : null;
  } catch {
    return null;
  }
}
