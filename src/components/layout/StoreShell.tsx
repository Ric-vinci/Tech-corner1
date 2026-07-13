import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import CheckoutHeader from "@/components/layout/CheckoutHeader";
import Footer from "@/components/layout/Footer";
import UspBar from "@/components/layout/UspBar";
import { buyUsp, sellUsp } from "@/data/content";
import type { StoreMode, UspItem } from "@/data/types";

type Props = {
  store: StoreMode;
  children: ReactNode;
  usp?: UspItem[];
  showUsp?: boolean;
  /**
   * "checkout" renders the minimal header (logo + Continue Shopping) and hides
   * the USP bar, matching the reference basket / checkout / success pages.
   */
  variant?: "default" | "checkout";
};

export default function StoreShell({
  store,
  children,
  usp,
  showUsp = true,
  variant = "default",
}: Props) {
  const uspItems = usp ?? (store === "sell" ? sellUsp : buyUsp);
  const isCheckout = variant === "checkout";

  return (
    <div className={`page-wrapper overflow-x-hidden ${store === "sell" ? "sell-my" : "buy-used"}`}>
      <header className="page-header">
        {isCheckout ? <CheckoutHeader store={store} /> : <Header store={store} />}
      </header>
      {!isCheckout && showUsp && <UspBar items={uspItems} />}
      {children}
      <Footer store={store} />
    </div>
  );
}
