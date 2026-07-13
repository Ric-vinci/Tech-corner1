import { Suspense } from "react";
import { notFound } from "next/navigation";

import SellBrandCatalogSkeleton from "@/components/catalog/SellBrandCatalogSkeleton";
import ReadMoreDescription from "@/components/catalog/ReadMoreDescription";
import SellBrandCatalogSection from "@/components/pages/SellBrandCatalogSection";
import SellBrandPageShell from "@/components/pages/SellBrandPageShell";
import {
  getSellBrandHeroImage,
  getSellBrandPageTitle,
  getSellBrandSidebarLinks,
  getSellCategory,
} from "@/data/sell-catalog";
import { parseSellCatalogParams, sellBrandCatalogPath } from "@/lib/sell/catalog-params";

type Props = {
  brand: string;
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function SellBrandPage({ brand, searchParams = {} }: Props) {
  const category = getSellCategory("mobile");
  if (!category) notFound();

  const catalogParams = parseSellCatalogParams(searchParams);
  const pageTitle = getSellBrandPageTitle(brand);
  const heroImage = getSellBrandHeroImage("mobile", brand) ?? category.heroImage;
  const basePath = sellBrandCatalogPath("mobile", brand);
  const modelLinks = getSellBrandSidebarLinks("mobile", brand);

  return (
    <SellBrandPageShell
      pageTitle={pageTitle}
      heroImage={heroImage}
      categoryTitle={category.title}
      modelLinks={modelLinks}
    >
      <Suspense fallback={<SellBrandCatalogSkeleton limit={catalogParams.limit} />}>
        <SellBrandCatalogSection brand={brand} catalogParams={catalogParams} basePath={basePath} />
      </Suspense>
      <ReadMoreDescription
        paragraphs={[
          `Sell your ${pageTitle.replace(/^Trade In Your /i, "")} to 4gadgets for a great price. We accept devices in any condition and offer free postage on all trade-ins.`,
          "Select your model above to get an instant quote. Payment is processed within 2 days of us receiving your device.",
        ]}
      />
    </SellBrandPageShell>
  );
}
