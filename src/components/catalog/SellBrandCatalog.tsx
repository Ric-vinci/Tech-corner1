"use client";

import { useRouter } from "next/navigation";
import type { CatalogProduct } from "@/data/types";
import type { SellCatalogParams } from "@/lib/sell/catalog-params";
import { buildSellCatalogQuery } from "@/lib/sell/catalog-params";
import SellCatalogToolbar from "./SellCatalogToolbar";
import SellCatalogPagination from "./SellCatalogPagination";
import SellProductGrid from "./SellProductGrid";

type Props = {
  basePath: string;
  products: CatalogProduct[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  from: number;
  to: number;
  showingAll: boolean;
  sort: SellCatalogParams["sort"];
};

export default function SellBrandCatalog({
  basePath,
  products,
  totalCount,
  page,
  limit,
  totalPages,
  from,
  to,
  showingAll,
  sort,
}: Props) {
  const router = useRouter();

  function navigate(params: Partial<SellCatalogParams>) {
    const href = `${basePath}${buildSellCatalogQuery({
      limit: params.limit ?? limit,
      page: params.page ?? page,
      sort: params.sort ?? sort,
    })}`;
    router.push(href);
  }

  // Brands we hold no trade-in prices for (e.g. CAT) — the reference site shows
  // this same message rather than a toolbar and an empty grid.
  if (!products.length) {
    return (
      <div className="message info empty">
        <div>We can&apos;t find products matching the selection.</div>
      </div>
    );
  }

  return (
    <>
      <SellCatalogToolbar
        from={from}
        to={to}
        total={totalCount}
        perPage={limit}
        sort={sort}
        showingAll={showingAll}
        onPerPageChange={(value) => navigate({ limit: value, page: 1 })}
        onSortChange={(value) => navigate({ sort: value, page: 1 })}
      />
      <SellProductGrid products={products} />
      {!showingAll && (
        <SellCatalogPagination
          basePath={basePath}
          currentPage={page}
          totalPages={totalPages}
          limit={limit}
          sort={sort}
        />
      )}
    </>
  );
}
