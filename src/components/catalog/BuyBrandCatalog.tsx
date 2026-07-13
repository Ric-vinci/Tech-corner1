"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { CatalogProduct } from "@/data/types";
import type { SellCatalogParams } from "@/lib/sell/catalog-params";
import ProductGrid from "./ProductGrid";
import SellCatalogToolbar from "./SellCatalogToolbar";
import SellCatalogPagination from "./SellCatalogPagination";

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

export default function BuyBrandCatalog({
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
  const searchParams = useSearchParams();

  // Build an href off the current params so model/price filters survive toolbar
  // and pagination changes.
  function hrefWith(overrides: Record<string, string | number | null>) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (v == null || v === "" || (k === "product_list_limit" && v === 16) || (k === "p" && v === 1) || (k === "product_list_order" && v === "position")) {
        p.delete(k);
      } else {
        p.set(k, String(v));
      }
    }
    const qs = p.toString();
    return qs ? `${basePath}?${qs}` : basePath;
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
        onPerPageChange={(value) => router.push(hrefWith({ product_list_limit: value, p: 1 }))}
        onSortChange={(value) => router.push(hrefWith({ product_list_order: value, p: 1 }))}
      />
      <ProductGrid
        products={products}
        variant="buy"
        gridClassName="mx-auto pt-4 pb-12 grid gap-4 grid-cols-2 md:grid-cols-3"
      />
      {!showingAll && (
        <SellCatalogPagination
          basePath={basePath}
          currentPage={page}
          totalPages={totalPages}
          limit={limit}
          sort={sort}
          hrefForPage={(p) => hrefWith({ p })}
        />
      )}
    </>
  );
}
