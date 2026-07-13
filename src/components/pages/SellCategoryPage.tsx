import { notFound } from "next/navigation";
import StoreShell from "@/components/layout/StoreShell";
import Breadcrumbs from "@/components/catalog/Breadcrumbs";
import CategoryHero from "@/components/catalog/CategoryHero";
import BrandGrid from "@/components/catalog/BrandGrid";
import CatalogLayout from "@/components/catalog/CatalogLayout";
import ProductGrid from "@/components/catalog/ProductGrid";
import ReadMoreDescription from "@/components/catalog/ReadMoreDescription";
import { getSellCategoryAsync } from "@/data/sell-catalog";

type Props = {
  categorySlug: string;
};

export default async function SellCategoryPage({ categorySlug }: Props) {
  const category = await getSellCategoryAsync(categorySlug);
  if (!category) notFound();

  const breadcrumbs = [
    { label: "Home", href: "/sell-my" },
    { label: category.title },
  ];

  const isBrandPicker = category.layout === "brand-picker" && category.brands;

  return (
    <StoreShell store="sell">
      <main className="page-main">
        <div className="container -mb-4">
          <CategoryHero title={category.heading} image={category.heroImage} variant="sell" />
        </div>

        <Breadcrumbs items={breadcrumbs} variant="sell" />

        <div className="category-bottom container">
          {isBrandPicker ? (
            <BrandGrid brands={category.brands!} variant="sell-mobile" />
          ) : (
            <CatalogLayout filters={category.filters} productCount={category.products.length}>
              <ProductGrid products={category.products} variant="sell" />
            </CatalogLayout>
          )}

          <ReadMoreDescription paragraphs={category.description} />
        </div>
      </main>
    </StoreShell>
  );
}
