"use client";

import { CartProvider } from "@/components/cart/CartProvider";
import TradeInCartDrawer from "@/components/cart/TradeInCartDrawer";

export default function SellProviders({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <TradeInCartDrawer />
    </CartProvider>
  );
}
