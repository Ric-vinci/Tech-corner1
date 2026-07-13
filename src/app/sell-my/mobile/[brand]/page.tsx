import SellBrandPage from "@/components/pages/SellBrandPage";
import { sellBrandProducts } from "@/data/sell-catalog";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ brand: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  const brands = Object.keys(sellBrandProducts.mobile ?? {});
  const allBrands = [
    "samsung",
    "apple",
    "google",
    "huawei",
    "honor",
    "oppo",
    "oneplus",
    "cat",
    "blackberry",
    "htc",
    "lg",
    "motorola",
    "nokia",
    "razer",
    "realme",
    "redmi",
    "sony",
    "xiaomi",
    "zte",
    "hmd",
    "nothing",
  ];
  return [...new Set([...brands, ...allBrands])].map((brand) => ({ brand }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand } = await params;
  const label = brand.charAt(0).toUpperCase() + brand.slice(1);
  return { title: `Trade In Your ${label} Phone — 4gadgets` };
}

export default async function SellMobileBrandPage({ params, searchParams }: Props) {
  const { brand } = await params;
  const query = await searchParams;
  return <SellBrandPage brand={brand} searchParams={query} />;
}
