import StoreShell from "@/components/layout/StoreShell";
import BuyCartPage from "@/components/cart/BuyCartPage";

export const metadata = { title: "My Basket — 4gadgets" };

export default function BuyCartRoute() {
  return (
    <StoreShell store="buy" variant="checkout">
      <BuyCartPage />
    </StoreShell>
  );
}
