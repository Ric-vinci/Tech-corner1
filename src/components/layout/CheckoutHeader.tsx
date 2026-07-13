import Link from "next/link";
import type { StoreMode } from "@/data/types";
import BrandLogo from "@/components/layout/BrandLogo";

/**
 * Minimal header used on the basket / checkout / success pages: logo plus a
 * "Continue Shopping" link, no navigation or USP bar. Mirrors
 * wapple_html/sell/check-out/addbasket/*.
 */
export default function CheckoutHeader({ store }: { store: StoreMode }) {
  const storeHome = store === "sell" ? "/sell-my" : "/buy-used";

  return (
    <div className="header content container flex items-center md:p-5">
      <div className="logo flex items-center justify-self-center md:mr-4">
        <Link href={storeHome} title="Tech Corner" aria-label="Tech Corner home" className="flex items-center">
          <BrandLogo />
        </Link>
      </div>

      <Link href={storeHome} className="btn btn-secondary ml-auto hidden lg:block">
        Continue Shopping
      </Link>
    </div>
  );
}
