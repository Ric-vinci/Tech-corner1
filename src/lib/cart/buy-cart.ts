// The buy basket (refurbished devices a customer is purchasing) lives in
// localStorage until checkout — separate from the trade-in basket.

export type BuyCartItem = {
  /** Unit key = the specific refurb unit (Shopify variant). */
  id: string;
  productName: string;
  href: string;
  image: string;
  colour: string | null;
  storage: string | null;
  grade: string | null;
  price: number;
  variantId: string | null;
  quantity: number;
};

export const BUY_CART_STORAGE_KEY = "tc3-buy-cart";

export function readBuyCart(): BuyCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BUY_CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BuyCartItem[]) : [];
  } catch {
    return [];
  }
}

export function writeBuyCart(items: BuyCartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BUY_CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("tc3-buy-cart-changed"));
}

export function addToBuyCart(item: BuyCartItem): BuyCartItem[] {
  const items = readBuyCart();
  const existing = items.find((i) => i.id === item.id);
  if (existing) existing.quantity += item.quantity;
  else items.push(item);
  writeBuyCart(items);
  return items;
}

export function buyCartCount(items: BuyCartItem[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}
