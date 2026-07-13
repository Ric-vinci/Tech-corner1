import StoreShell from "@/components/layout/StoreShell";
import TradeInCartPage from "@/components/cart/TradeInCartPage";

export const metadata = { title: "My Basket — 4gadgets" };

export default function SellCartPage() {
  return (
    <StoreShell store="sell" variant="checkout">
      <TradeInCartPage />
    </StoreShell>
  );
}
