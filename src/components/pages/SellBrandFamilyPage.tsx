import { notFound } from "next/navigation";

import ReadMoreDescription from "@/components/catalog/ReadMoreDescription";
import SellBrandCatalog from "@/components/catalog/SellBrandCatalog";
import SellBrandPageShell from "@/components/pages/SellBrandPageShell";
import {
  getSellBrandFamilyPageAsync,
  getSellBrandHeroImage,
  getSellBrandPageTitle,
  getSellBrandSidebarLinks,
  getSellCategory,
} from "@/data/sell-catalog";
import { sellBrandCatalogPath } from "@/lib/sell/catalog-params";

type Props = {
  brand: string;
  family: string;
};

export default async function SellBrandFamilyPage({ brand, family }: Props) {
  const category = getSellCategory("mobile");
  if (!category) notFound();

  const familyPage = await getSellBrandFamilyPageAsync("mobile", brand, family);
  if (!familyPage) notFound();

  const brandTitle = getSellBrandPageTitle(brand);
  const heroImage = getSellBrandHeroImage("mobile", brand) ?? category.heroImage;
  const basePath = sellBrandCatalogPath("mobile", brand);

  const breadcrumbs = [
    { label: "Home", href: "/sell-my" },
    { label: category.title, href: "/sell-my/mobile" },
    { label: brandTitle, href: `/sell-my/mobile/${brand}` },
    { label: familyPage.familyLabel },
  ];

  return (
    <SellBrandPageShell
      pageTitle={familyPage.familyLabel}
      heroImage={heroImage}
      categoryTitle={category.title}
      modelLinks={familyPage.modelLinks}
      breadcrumbs={breadcrumbs}
    >
      <SellBrandCatalog
        basePath={basePath}
        products={familyPage.products}
        totalCount={familyPage.totalCount}
        page={1}
        limit={familyPage.totalCount}
        totalPages={1}
        from={familyPage.totalCount === 0 ? 0 : 1}
        to={familyPage.totalCount}
        showingAll
        sort="position"
      />
      <ReadMoreDescription
        paragraphs={[
          `Sell your ${familyPage.familyLabel.replace(/^Trade In Your /i, "")} to 4gadgets for a great price. We accept devices in any condition and offer free postage on all trade-ins.`,
          "Select your storage option above to get an instant quote. Payment is processed within 2 days of us receiving your device.",
        ]}
      />
    </SellBrandPageShell>
  );
}
