import { unstable_cache } from "next/cache";
import type { SellCatalogSort } from "@/lib/sell/catalog-params";
import { adminRequest } from "./admin-client";
import { ADMIN_COLLECTION_PRODUCTS_COUNT_QUERY } from "./admin-queries";
import { canUseAdminCatalogReads, fetchAdminCollectionProducts } from "./admin-catalog";
import { isShopifyConfigured, preferStorefrontCatalogReads } from "./config";
import type { ShopifyProductNode } from "./mappers";
import { COLLECTION_PRODUCTS_QUERY } from "./queries";
import { storefrontRequest } from "./storefront-client";

type CollectionProductsResponse = {
  collection: {
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: ShopifyProductNode[];
    };
  } | null;
};

const productCountCache = new Map<string, number>();

/** Known totals avoid a slow count walk on first paint for large collections. */
const KNOWN_COLLECTION_COUNTS: Record<string, number> = {
  "samsung-mobile": 250,
};

async function fetchCollectionProductCount(handle: string): Promise<number> {
  if (productCountCache.has(handle)) return productCountCache.get(handle)!;

  const knownCount = KNOWN_COLLECTION_COUNTS[handle];
  if (knownCount) {
    productCountCache.set(handle, knownCount);
    return knownCount;
  }

  if (canUseAdminCatalogReads()) {
    try {
      const data = await adminRequest<{ collectionByHandle: { productsCount: number } | null }>(
        ADMIN_COLLECTION_PRODUCTS_COUNT_QUERY,
        { handle },
      );
      const count = data.collectionByHandle?.productsCount ?? 0;
      if (count > 0) {
        productCountCache.set(handle, count);
        return count;
      }
    } catch {
      // fall through to storefront count walk
    }
  }

  let total = 0;
  let after: string | null = null;
  let hasNext = true;
  while (hasNext) {
    const data: CollectionProductsResponse = await storefrontRequest(COLLECTION_PRODUCTS_QUERY, {
      handle,
      first: 250,
      after,
      reverse: true,
      sortKey: "COLLECTION_DEFAULT",
    });
    if (!data.collection) break;
    total += data.collection.products.nodes.length;
    hasNext = data.collection.products.pageInfo.hasNextPage;
    after = data.collection.products.pageInfo.endCursor;
  }

  productCountCache.set(handle, total);
  return total;
}

export type CollectionProductsPage = {
  products: ShopifyProductNode[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  from: number;
  to: number;
  showingAll: boolean;
};

function sortToShopify(sort: SellCatalogSort): { sortKey: string; reverse: boolean } {
  switch (sort) {
    case "name":
      return { sortKey: "TITLE", reverse: false };
    case "low_to_high":
      return { sortKey: "PRICE", reverse: false };
    case "high_to_low":
      return { sortKey: "PRICE", reverse: true };
    default:
      return { sortKey: "COLLECTION_DEFAULT", reverse: true };
  }
}

const STOREFRONT_MAX_PAGE_SIZE = 250;

async function fetchStorefrontProductWindow(
  handle: string,
  offset: number,
  count: number,
  sort: SellCatalogSort,
): Promise<ShopifyProductNode[]> {
  const { sortKey, reverse } = sortToShopify(sort);
  const collected: ShopifyProductNode[] = [];
  let after: string | null = null;
  let index = 0;

  while (collected.length < count) {
    const data: CollectionProductsResponse = await storefrontRequest(COLLECTION_PRODUCTS_QUERY, {
      handle,
      first: STOREFRONT_MAX_PAGE_SIZE,
      after,
      reverse,
      sortKey,
    });

    if (!data.collection) break;

    for (const node of data.collection.products.nodes) {
      if (index >= offset && collected.length < count) {
        collected.push(node);
      }
      index += 1;
      if (collected.length >= count) break;
    }

    if (!data.collection.products.pageInfo.hasNextPage) break;
    after = data.collection.products.pageInfo.endCursor;
  }

  return collected;
}

async function fetchStorefrontProductsPage(
  handle: string,
  limit: number,
  page: number,
  sort: SellCatalogSort,
): Promise<CollectionProductsPage | null> {
  const offset = (page - 1) * limit;
  const [totalCount, nodes] = await Promise.all([
    fetchCollectionProductCount(handle),
    fetchStorefrontProductWindow(handle, offset, limit, sort),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const safePage = Math.min(page, totalPages);

  if (offset > 0 && nodes.length === 0 && totalCount > 0) return null;

  const from = totalCount === 0 ? 0 : offset + 1;
  const to = Math.min(offset + nodes.length, totalCount);
  const showingAll = limit >= totalCount && safePage === 1;

  return {
    products: nodes,
    totalCount,
    page: safePage,
    limit,
    totalPages,
    from,
    to,
    showingAll,
  };
}

function paginateAdminProducts(
  nodes: ShopifyProductNode[],
  limit: number,
  page: number,
  sort: SellCatalogSort,
): CollectionProductsPage {
  let sorted = [...nodes];
  if (sort === "name") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "low_to_high" || sort === "high_to_low") {
    sorted.sort((a, b) => {
      const pa = parseFloat(a.priceRange?.minVariantPrice?.amount ?? "0");
      const pb = parseFloat(b.priceRange?.minVariantPrice?.amount ?? "0");
      return sort === "low_to_high" ? pa - pb : pb - pa;
    });
  }

  const totalCount = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const products = sorted.slice(start, start + limit);
  const from = totalCount === 0 ? 0 : start + 1;
  const to = Math.min(start + limit, totalCount);
  const showingAll = limit >= totalCount;

  return { products, totalCount, page: safePage, limit, totalPages, from, to, showingAll };
}

export async function fetchCollectionProductsPage(
  handle: string,
  { limit, page, sort }: { limit: number; page: number; sort: SellCatalogSort },
): Promise<CollectionProductsPage | null> {
  if (!isShopifyConfigured()) return null;

  const cached = unstable_cache(
    async () => {
      if (preferStorefrontCatalogReads()) {
        const result = await fetchStorefrontProductsPage(handle, limit, page, sort);
        if (result) return result;
      }

      if (canUseAdminCatalogReads()) {
        const nodes = await fetchAdminCollectionProducts(handle);
        return paginateAdminProducts(nodes, limit, page, sort);
      }

      return fetchStorefrontProductsPage(handle, limit, page, sort);
    },
    ["collection-products", handle, String(limit), String(page), sort],
    { revalidate: 300, tags: [`collection-products-${handle}`] },
  );

  return cached();
}
