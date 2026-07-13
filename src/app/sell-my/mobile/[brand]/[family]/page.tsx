import SellBrandFamilyPage from "@/components/pages/SellBrandFamilyPage";
import samsungMobileData from "@/data/generated/samsung-mobile.json";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ brand: string; family: string }>;
};

export function generateStaticParams() {
  return (samsungMobileData.modelLinks as { href: string }[]).map((link) => {
    const parts = link.href.split("/");
    return {
      brand: parts[parts.length - 2] ?? "samsung",
      family: parts[parts.length - 1] ?? "",
    };
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { family } = await params;
  const label = family.replace(/-/g, " ").replace(/^trade in your /i, "");
  return { title: `Trade In Your ${label} — 4gadgets` };
}

export default async function SellMobileBrandFamilyPage({ params }: Props) {
  const { brand, family } = await params;
  return <SellBrandFamilyPage brand={brand} family={family} />;
}
