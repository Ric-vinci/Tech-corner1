import HeroSlider from "@/components/buy/HeroSlider";
import BrandButtons from "@/components/buy/BrandButtons";
import CategoryGrid from "@/components/ui/CategoryGrid";
import ProductCarousel from "@/components/ui/ProductCarousel";
import StoreShell from "@/components/layout/StoreShell";
import { WhyRefurbished, PromoBar, TradeInBanner, AboutSection } from "@/components/buy/BuySections";
import { buyTopCategories, buyTrending } from "@/data/content";

export default function BuyHomePage() {
  return (
    <StoreShell store="buy">
      <main className="page-main">
        <div className="cms-home cms-index-index page-layout-1column">
          <div className="columns">
            <div className="column main">
              <HeroSlider />

              <div className="recomender-widget pt-11 md:py-12">
                <ProductCarousel
                  title="Hot Recommendations"
                  products={buyTrending}
                />
              </div>

              <BrandButtons />

              <h3 className="text-2xl mb-6 md:mb-8">Top Categories</h3>
              <p className="hidden mb-7 text-lg text-grey-dark md:block md:-mt-5">Shop our bestselling gadgets</p>
              <CategoryGrid cards={buyTopCategories} />

              <WhyRefurbished />

              <PromoBar />
              <TradeInBanner />
              <AboutSection />
            </div>
          </div>
        </div>
      </main>
    </StoreShell>
  );
}
