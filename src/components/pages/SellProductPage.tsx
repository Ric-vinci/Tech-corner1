import { notFound } from "next/navigation";
import StoreShell from "@/components/layout/StoreShell";
import Breadcrumbs from "@/components/catalog/Breadcrumbs";
import SellProductDetail from "@/components/catalog/SellProductDetail";
import { getSellProductAsync, getSellProductBreadcrumbs } from "@/data/sell-catalog";

type Props = {
  slug: string;
};

export default async function SellProductPage({ slug }: Props) {
  const product = await getSellProductAsync(slug);
  if (!product) notFound();

  const breadcrumbs = getSellProductBreadcrumbs(product);

  return (
    <StoreShell store="sell">
      <main id="maincontent" className="page-main catalog-product-view">
        <Breadcrumbs items={breadcrumbs} variant="sell" />

        <div className="columns">
          <div className="column main">
            <SellProductDetail product={product} />
          </div>
        </div>
      </main>
    </StoreShell>
  );
}
