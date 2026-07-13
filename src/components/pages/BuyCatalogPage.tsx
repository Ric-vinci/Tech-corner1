import { notFound } from "next/navigation";
import StoreShell from "@/components/layout/StoreShell";
import Breadcrumbs from "@/components/catalog/Breadcrumbs";
import CategoryHero from "@/components/catalog/CategoryHero";
import CatalogLayout from "@/components/catalog/CatalogLayout";
import ProductGrid from "@/components/catalog/ProductGrid";
import ProductDetail from "@/components/catalog/ProductDetail";
import ReadMoreDescription from "@/components/catalog/ReadMoreDescription";
import { resolveBuyPathAsync } from "@/data/buy-catalog";

type Props = {
  slug: string[];
};

export default async function BuyCatalogPage({ slug }: Props) {
  const resolved = await resolveBuyPathAsync(slug);

  if (resolved.type === "product" && resolved.product) {
    const product = resolved.product;
    return (
      <StoreShell store="buy">
        <main className="container pb-16 pt-6">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: product.name },
            ]}
          />
          <ProductDetail product={product} store="buy" />
        </main>
      </StoreShell>
    );
  }

  const collection = resolved.collection;
  if (!collection) notFound();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    ...(slug.length > 1
      ? [{ label: collection.title.replace(/^Refurbished /, ""), href: `/buy-used/${slug[0]}` }]
      : []),
    ...(slug.length > 1 ? [{ label: collection.heading }] : [{ label: collection.title }]),
  ];

  return (
    <StoreShell store="buy">
      <main className="container pb-16 pt-6">
        <CategoryHero title={collection.heading} image={collection.heroImage} />
        <Breadcrumbs items={breadcrumbs} />

        <CatalogLayout filters={collection.filters} productCount={collection.products.length}>
          <ProductGrid products={collection.products} variant="buy" />
        </CatalogLayout>

        <ReadMoreDescription paragraphs={collection.description} />
      </main>
    </StoreShell>
  );
}
