import BuyCatalogPage from "@/components/pages/BuyCatalogPage";
import BuyMobileHub from "@/components/pages/BuyMobileHub";
import BuyBrandPage from "@/components/pages/BuyBrandPage";
import BuyProductPage from "@/components/pages/BuyProductPage";
import { buyCollections } from "@/data/buy-catalog";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateStaticParams() {
  const collectionSlugs = Object.keys(buyCollections).map((key) => ({ slug: [key] }));
  const productSlugs = Object.values(buyCollections)
    .flatMap((c) => c.products)
    .map((p) => {
      const path = p.href.replace("/buy-used/", "");
      return { slug: path.split("/") };
    });
  return [...collectionSlugs, ...productSlugs];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = slug[slug.length - 1]?.replace(".html", "").replace(/-/g, " ") ?? "Shop";
  return { title: `${title} — 4gadgets` };
}

export default async function BuyUsedSlugPage({ params, searchParams }: Props) {
  const { slug } = await params;

  // A product detail page: /buy-used/<handle>.html → buy PDP with variant
  // selectors + add-to-basket.
  const last = slug[slug.length - 1];
  if (last?.endsWith(".html")) {
    return <BuyProductPage handle={last} />;
  }

  // The mobile-phones landing page is a brand-picker hub (banner + top-selling
  // carousel + brand tiles), not a flat product grid.
  if (slug.length === 1 && (slug[0] === "mobile-phones" || slug[0] === "mobile")) {
    return <BuyMobileHub />;
  }

  // Brand pages (/buy-used/mobile-phones/samsung) are full catalog pages:
  // top-selling carousel + Shop-By sidebar + toolbar (16/32/64/500 per page) + grid.
  if (slug.length === 2 && slug[0] === "mobile-phones") {
    return <BuyBrandPage brand={slug[1]} searchParams={await searchParams} />;
  }

  return <BuyCatalogPage slug={slug} />;
}
