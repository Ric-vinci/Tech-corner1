export type TradeInCartItem = {
  id: string;
  productName: string;
  productSlug: string;
  productHref: string;
  image: string;
  shopifyProductId?: string;
  shopifyVariantId?: string;
  condition: string;
  returnPack: string;
  paymentMethod: string;
  quantity: number;
  unitPrice: number;
  imei?: string;
  customerEmail: string;
  customerName?: string;
  payoutDetails: Record<string, unknown>;
  confirmAccount: boolean;
  confirmUnlocked: boolean;
  confirmPayment: boolean;
};

export const CART_STORAGE_KEY = "tc3-trade-in-cart";

export function readCartFromStorage(): TradeInCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TradeInCartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCartToStorage(items: TradeInCartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function cartItemCount(items: TradeInCartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartTotal(items: TradeInCartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}
