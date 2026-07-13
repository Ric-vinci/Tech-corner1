import SellProductPage from "@/components/pages/SellProductPage";
import { sellTradeIns } from "@/data/content";
import { sellCategories } from "@/data/sell-catalog";
import samsungMobileData from "@/data/generated/samsung-mobile.json";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  const fromTradeIns = sellTradeIns.map((p) => ({
    slug: p.href.replace("/sell-my/", ""),
  }));
  const fromCategories = Object.values(sellCategories).flatMap((c) =>
    c.products.map((p) => ({ slug: p.href.replace("/sell-my/", "") })),
  );
  const fromSamsung = samsungMobileData.products.map((p) => ({
    slug: p.href.replace("/sell-my/", ""),
  }));
  const slugs = [...fromTradeIns, ...fromCategories, ...fromSamsung].map((p) => p.slug);
  return [...new Set(slugs)].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.replace(".html", "").replace(/-/g, " ");
  return { title: `${title} — Trade In — 4gadgets` };
}

export default async function SellProductSlugPage({ params }: Props) {
  const { slug } = await params;
  return <SellProductPage slug={slug} />;
}
