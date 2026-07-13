import CategoryGrid from "@/components/ui/CategoryGrid";
import ProductCarousel from "@/components/ui/ProductCarousel";
import StoreShell from "@/components/layout/StoreShell";
import {
  SellHero,
  HowItWorks,
  AnyConditionBanner,
  FreePostBanner,
} from "@/components/sell/SellSections";
import { sellCategories, sellTradeIns } from "@/data/content";

export default function SellHomePage() {
  return (
    <StoreShell store="sell">
      <main>
        <div className="container overflow-x-hidden pt-6">
          <SellHero />
          <HowItWorks />
        </div>

        <AnyConditionBanner />

        <div className="container overflow-x-hidden">
          <section className="mb-14">
            <h2 className="mb-6 text-2xl md:text-3xl">Find Your Device Below</h2>
            <CategoryGrid cards={sellCategories} />
          </section>

          <ProductCarousel
            title="Popular Trade Ins"
            subtitle="Frequently sold devices"
            products={sellTradeIns}
            variant="sell"
          />

          <FreePostBanner />
        </div>
      </main>
    </StoreShell>
  );
}
