import StoreShell from "@/components/layout/StoreShell";
import BuyCheckoutPage from "@/components/customer/BuyCheckoutPage";
import "@/styles/checkout.css";

export const metadata = { title: "Checkout Securely — 4gadgets" };

export default function BuyCheckoutRoute() {
  return (
    <StoreShell store="buy" variant="checkout">
      <main id="maincontent" className="page-main checkout-index-index">
        <div className="columns">
          <BuyCheckoutPage />
        </div>
      </main>
    </StoreShell>
  );
}
