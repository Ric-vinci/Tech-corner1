import { notFound } from "next/navigation";
import StoreShell from "@/components/layout/StoreShell";
import Breadcrumbs from "@/components/catalog/Breadcrumbs";
import CategoryHero from "@/components/catalog/CategoryHero";
import BuyFilterSidebar from "@/components/catalog/BuyFilterSidebar";
import ProductCarousel from "@/components/ui/ProductCarousel";
import ReadMoreDescription from "@/components/catalog/ReadMoreDescription";
import BuyBrandCatalog from "@/components/catalog/BuyBrandCatalog";
import { getBuyBrandCatalogPage, getBuyBrandMeta, COLOUR_OPTIONS, GRADE_OPTIONS, STORAGE_OPTIONS } from "@/lib/buy/catalog";
import { parseSellCatalogParams } from "@/lib/sell/catalog-params";

type Props = {
  brand: string;
  searchParams?: Record<string, string | string[] | undefined>;
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function BuyBrandPage({ brand, searchParams = {} }: Props) {
  const params = parseSellCatalogParams(searchParams);
  const model = one(searchParams.model);
  const priceMin = one(searchParams.price_min) != null ? Number(one(searchParams.price_min)) : undefined;
  const priceMax = one(searchParams.price_max) != null ? Number(one(searchParams.price_max)) : undefined;
  const list = (v: string | string[] | undefined) => (one(v) ? one(v)!.split(",").filter(Boolean) : undefined);
  const colour = list(searchParams.colour);
  const grade = list(searchParams.grade);
  const storage = list(searchParams.storage);

  const catalog = await getBuyBrandCatalogPage(brand, params, { model, priceMin, priceMax, colour, grade, storage });
  if (!catalog) notFound();

  const meta = getBuyBrandMeta(brand);
  const basePath = `/buy-used/mobile-phones/${brand}`;

  return (
    <StoreShell store="buy">
      <main className="page-main page-with-filter page-layout-2columns-left catalog-category-view">
        <div className="container -mb-4">
          <CategoryHero title={meta.pageTitle} image={meta.heroImage} variant="sell" />
        </div>

        {catalog.topSelling.length > 0 && (
          <div className="top-selling container pt-11 md:py-12">
            <ProductCarousel title="Our Top Selling" products={catalog.topSelling} variant="buy" />
          </div>
        )}

        <Breadcrumbs
          items={[
            { label: "Home", href: "/buy-used" },
            { label: "Refurbished Phones", href: "/buy-used/mobile-phones" },
            { label: meta.pageTitle },
          ]}
          variant="sell"
        />

        <div className="columns">
          <BuyFilterSidebar
            basePath={basePath}
            modelLinks={catalog.modelLinks}
            activeModel={catalog.filters.model}
            priceBounds={catalog.priceBounds}
            priceMin={catalog.filters.priceMin}
            priceMax={catalog.filters.priceMax}
            colourOptions={COLOUR_OPTIONS}
            gradeOptions={GRADE_OPTIONS}
            storageOptions={STORAGE_OPTIONS}
            selectedColours={catalog.filters.colour ?? []}
            selectedGrades={catalog.filters.grade ?? []}
            selectedStorages={catalog.filters.storage ?? []}
          />
          <div className="column main">
            <BuyBrandCatalog
              basePath={basePath}
              products={catalog.products}
              totalCount={catalog.totalCount}
              page={catalog.page}
              limit={catalog.limit}
              totalPages={catalog.totalPages}
              from={catalog.from}
              to={catalog.to}
              showingAll={catalog.showingAll}
              sort={catalog.sort}
            />
          </div>
        </div>

        <div className="container">
          <ReadMoreDescription
            paragraphs={[
              `Shop our full range of ${meta.pageTitle.toLowerCase()} at unbeatable prices. Every device is thoroughly tested, certified and covered by a 12-month warranty with free next-day delivery.`,
              "Order by 3pm Monday to Friday for free next-day delivery. Choose your model from the range above to see all available options.",
            ]}
          />
        </div>
      </main>
    </StoreShell>
  );
}
