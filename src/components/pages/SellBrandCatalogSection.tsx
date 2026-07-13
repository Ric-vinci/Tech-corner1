import SellBrandCatalog from "@/components/catalog/SellBrandCatalog";
import { getSellBrandCatalogPageAsync } from "@/data/sell-catalog";
import type { SellCatalogParams } from "@/lib/sell/catalog-params";

type Props = {
  brand: string;
  catalogParams: SellCatalogParams;
  basePath: string;
};

export default async function SellBrandCatalogSection({ brand, catalogParams, basePath }: Props) {
  const catalog = await getSellBrandCatalogPageAsync("mobile", brand, catalogParams);

  return (
    <SellBrandCatalog
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
  );
}
