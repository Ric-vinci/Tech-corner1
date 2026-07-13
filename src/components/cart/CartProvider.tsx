"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  cartItemCount,
  readCartFromStorage,
  type TradeInCartItem,
  writeCartToStorage,
} from "@/lib/cart/trade-in-cart";

type CartContextValue = {
  items: TradeInCartItem[];
  count: number;
  drawerOpen: boolean;
  addItem: (item: TradeInCartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<TradeInCartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setItems(readCartFromStorage());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeCartToStorage(items);
  }, [items, ready]);

  const addItem = useCallback((item: TradeInCartItem) => {
    setItems((current) => [...current, item]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((open) => !open), []);

  const value = useMemo(
    () => ({
      items,
      count: cartItemCount(items),
      drawerOpen,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    }),
    [items, drawerOpen, addItem, removeItem, updateQuantity, clearCart, openDrawer, closeDrawer, toggleDrawer],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
