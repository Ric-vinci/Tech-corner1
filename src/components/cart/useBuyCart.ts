"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readBuyCart,
  writeBuyCart,
  buyCartCount,
  type BuyCartItem,
} from "@/lib/cart/buy-cart";

/** Reactive view of the buy basket (localStorage), shared across components. */
export function useBuyCart() {
  const [items, setItems] = useState<BuyCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setItems(readBuyCart());
    sync();
    setHydrated(true);
    window.addEventListener("tc3-buy-cart-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("tc3-buy-cart-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const removeItem = useCallback((id: string) => {
    writeBuyCart(readBuyCart().filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    writeBuyCart(readBuyCart().map((i) => (i.id === id ? { ...i, quantity } : i)));
  }, []);

  const clearCart = useCallback(() => writeBuyCart([]), []);

  return { items, hydrated, count: buyCartCount(items), total: items.reduce((s, i) => s + i.price * i.quantity, 0), removeItem, updateQuantity, clearCart };
}
