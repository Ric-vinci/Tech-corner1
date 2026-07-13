import StoreShell from "@/components/layout/StoreShell";
import CheckoutSecurelyPage from "@/components/customer/CheckoutSecurelyPage";
import "@/styles/checkout.css";

export const metadata = { title: "Checkout Securely — 4gadgets" };

export default function SellCheckoutPage() {
  return (
    <StoreShell store="sell" variant="checkout">
      <main id="maincontent" className="page-main checkout-index-index">
        <div className="columns">
          <CheckoutSecurelyPage />
        </div>
      </main>
    </StoreShell>
  );
}
