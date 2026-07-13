import StoreShell from "@/components/layout/StoreShell";
import Breadcrumbs from "@/components/catalog/Breadcrumbs";
import CategoryHero from "@/components/catalog/CategoryHero";
import BrandGrid from "@/components/catalog/BrandGrid";
import ProductCarousel from "@/components/ui/ProductCarousel";
import ReadMoreDescription from "@/components/catalog/ReadMoreDescription";
import { fetchBuyCollectionFromShopify } from "@/lib/shopify/collections";
import { buyCollections } from "@/data/buy-catalog";
import { allowStaticCatalogFallback } from "@/lib/shopify/config";
import type { BrandItem } from "@/data/types";

/** Brand tiles on the Refurbished Phones landing hub (mirrors the reference DOM). */
const mobileBrands: BrandItem[] = [
  { label: "Samsung", slug: "samsung", href: "/buy-used/mobile-phones/samsung", image: "/images/buy-brands/SAMSUNG_1_2.png", cardLabel: "Refurbished Samsung Mobile Phones" },
  { label: "Apple", slug: "apple", href: "/buy-used/mobile-phones/apple", image: "/images/buy-brands/APPLE_1.png", cardLabel: "Refurbished Apple Mobile Phones" },
  { label: "Google", slug: "google", href: "/buy-used/mobile-phones/google", image: "/images/buy-brands/GOOGLE_PIXEL.png", cardLabel: "Refurbished Google Mobile Phones" },
  { label: "Huawei", slug: "huawei", href: "/buy-used/mobile-phones/huawei", image: "/images/buy-brands/HUAWEI_1.png", cardLabel: "Refurbished Huawei Mobile Phones" },
  { label: "OnePlus", slug: "oneplus", href: "/buy-used/mobile-phones/oneplus", image: "/images/buy-brands/ONEPLUS_1.png", cardLabel: "Refurbished OnePlus Mobile Phones" },
  { label: "Used & Refurbished", slug: "all-phones", href: "/buy-used/mobile-phones/all-phones", image: "/images/buy-brands/Mobile_Phone_Icon.png", cardLabel: "Used & Refurbished Phones" },
];

const description = [
  "Looking for a high-quality smartphone at a fraction of the cost? Then you're in the right place, as nobody does refurbished phones like 4gadgets. We offer a wide selection of second-hand mobiles from the best-loved brands that are thoroughly tested, certified and ready to use — just like new but at a more affordable price. Shop our full range of used mobile phones today. Order by 3pm Monday to Friday for free next-day delivery.",
  "What is a Refurbished Phone? A refurbished phone is a pre-owned device that has been returned, repaired (if necessary) and restored to a like-new condition by professionals. These phones undergo rigorous testing to ensure they function just as well as new models, with any faulty parts replaced. Refurbished phones offer a reliable, cost-effective alternative to buying new.",
  "Why Buy a Refurbished Phone? Refurbished phones offer plenty of benefits that make them a smart choice: affordability, sustainability and the same high-quality smartphones at a fraction of the cost. Whether you're looking for the latest model or a more budget-friendly option, you can enjoy the same features and performance without the hefty price tag of buying new.",
];

export default async function BuyMobileHub() {
  const collection =
    (await fetchBuyCollectionFromShopify(["mobile-phones"])) ??
    (allowStaticCatalogFallback() ? buyCollections["mobile-phones"] : undefined);

  const topSelling = (collection?.products ?? []).slice(0, 12);

  return (
    <StoreShell store="buy">
      <main className="page-main">
        <div className="container -mb-4">
          <CategoryHero title="Refurbished Phones" image="/images/buy-brands/Mobile_Phones_-_ALL.png" variant="sell" />
        </div>

        {topSelling.length > 0 && (
          <div className="top-selling container pt-11 md:py-12">
            <ProductCarousel title="Our Top Selling" products={topSelling} variant="buy" />
          </div>
        )}

        <Breadcrumbs
          items={[{ label: "Home", href: "/buy-used" }, { label: "Refurbished Phones" }]}
          variant="sell"
        />

        <div className="category-bottom container">
          <BrandGrid brands={mobileBrands} variant="sell-mobile" />
          <ReadMoreDescription paragraphs={description} />
        </div>
      </main>
    </StoreShell>
  );
}
