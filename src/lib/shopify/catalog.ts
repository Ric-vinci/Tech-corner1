import {
  canUseAdminCatalogReads,
  fetchAdminCollectionProducts,
  fetchAdminProductByHandle,
} from "./admin-catalog";
import { isShopifyConfigured, preferStorefrontCatalogReads } from "./config";
import { brandCollectionHandle } from "./category-map";
import { fetchCollectionProductsPage, type CollectionProductsPage } from "./collection-products";
import {
  buildModelFilterLinks,
  shopifyProductToBuyCatalogProduct,
  shopifyProductToCatalogProduct,
  shopifyProductToSellDetail,
  type ShopifyProductNode,
} from "./mappers";
import { COLLECTION_PRODUCTS_QUERY, PRODUCT_BY_HANDLE_QUERY } from "./queries";
import { storefrontRequest } from "./storefront-client";
import type { CatalogProduct, ModelFilterLink, SellProductDetail } from "@/data/types";
import type { SellCatalogSort } from "@/lib/sell/catalog-params";

const REVALIDATE_SECONDS = 3600;

type CollectionProductsResponse = {
  collection: {
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: ShopifyProductNode[];
    };
  } | null;
};

type ProductByHandleResponse = {
  product: ShopifyProductNode | null;
};

async function fetchAllCollectionProductsFromStorefront(handle: string): Promise<ShopifyProductNode[]> {
  const nodes: ShopifyProductNode[] = [];
  let after: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const page: CollectionProductsResponse = await storefrontRequest(COLLECTION_PRODUCTS_QUERY, {
      handle,
      first: 250,
      after,
      reverse: true,
      sortKey: "COLLECTION_DEFAULT",
    });

    if (!page.collection) break;

    nodes.push(...page.collection.products.nodes);
    hasNextPage = page.collection.products.pageInfo.hasNextPage;
    after = page.collection.products.pageInfo.endCursor;
  }

  return nodes;
}

export async function fetchAllCollectionProducts(handle: string): Promise<ShopifyProductNode[]> {
  if (preferStorefrontCatalogReads()) {
    const nodes = await fetchAllCollectionProductsFromStorefront(handle);
    if (nodes.length) return nodes;
  }
  if (canUseAdminCatalogReads()) {
    return fetchAdminCollectionProducts(handle);
  }
  return fetchAllCollectionProductsFromStorefront(handle);
}

export async function fetchBrandProductsFromShopify(
  categorySlug: string,
  brandSlug: string,
): Promise<CatalogProduct[] | null> {
  if (!isShopifyConfigured()) return null;

  try {
    const handle = brandCollectionHandle(categorySlug, brandSlug);
    const nodes = await fetchAllCollectionProducts(handle);
    return nodes.map(shopifyProductToCatalogProduct);
  } catch (error) {
    console.error("[shopify] fetchBrandProducts failed:", error);
    return null;
  }
}

/**
 * Refurb (trade-in) units are buy-side resale inventory, not sell-catalogue
 * models — they can end up in a brand's Shopify collection when published, so
 * exclude them from the sell listing (which is about what a customer can trade in).
 */
function isRefurbInventoryNode(node: ShopifyProductNode): boolean {
  return (
    (node.tags ?? []).some((t) => t.toLowerCase() === "trade-in") ||
    /-ti-[a-z0-9]{6,}$/i.test(node.handle) ||
    /\(trade-in refurb\)/i.test(node.title)
  );
}

export async function fetchBrandSellPageFromShopify(
  categorySlug: string,
  brandSlug: string,
  pagination: { limit: number; page: number; sort: SellCatalogSort },
): Promise<(Omit<CollectionProductsPage, "products"> & { products: SellProductDetail[]; modelLinks: ModelFilterLink[] }) | null> {
  if (!isShopifyConfigured()) return null;

  try {
    const handle = brandCollectionHandle(categorySlug, brandSlug);
    const pageResult = await fetchCollectionProductsPage(handle, pagination);
    if (!pageResult) return null;

    const products = pageResult.products.filter((n) => !isRefurbInventoryNode(n)).map(shopifyProductToSellDetail);
    const { products: _nodes, ...meta } = pageResult;
    return {
      ...meta,
      products,
      modelLinks: buildModelFilterLinks(products),
    };
  } catch (error) {
    console.error("[shopify] fetchBrandSellPage failed:", error);
    return null;
  }
}

export async function fetchBrandSellDetailsFromShopify(
  categorySlug: string,
  brandSlug: string,
): Promise<{ products: SellProductDetail[]; modelLinks: ModelFilterLink[] } | null> {
  if (!isShopifyConfigured()) return null;

  try {
    const handle = brandCollectionHandle(categorySlug, brandSlug);
    const nodes = await fetchAllCollectionProducts(handle);
    const products = nodes.filter((n) => !isRefurbInventoryNode(n)).map(shopifyProductToSellDetail);
    return {
      products,
      modelLinks: buildModelFilterLinks(products),
    };
  } catch (error) {
    console.error("[shopify] fetchBrandSellDetails failed:", error);
    return null;
  }
}

async function fetchProductByHandle(handle: string): Promise<ShopifyProductNode | null> {
  if (preferStorefrontCatalogReads()) {
    const data = await storefrontRequest<ProductByHandleResponse>(PRODUCT_BY_HANDLE_QUERY, { handle });
    if (data.product) return data.product;
  }
  if (canUseAdminCatalogReads()) {
    return fetchAdminProductByHandle(handle);
  }
  const data = await storefrontRequest<ProductByHandleResponse>(PRODUCT_BY_HANDLE_QUERY, { handle });
  return data.product;
}

export async function fetchSellProductFromShopify(slug: string): Promise<SellProductDetail | null> {
  if (!isShopifyConfigured()) return null;

  const handle = slug.replace(/\.html$/, "");

  try {
    const product = await fetchProductByHandle(handle);
    if (!product) return null;
    return shopifyProductToSellDetail(product);
  } catch (error) {
    console.error("[shopify] fetchSellProduct failed:", error);
    return null;
  }
}

export async function fetchBuyProductFromShopify(slug: string): Promise<CatalogProduct | null> {
  if (!isShopifyConfigured()) return null;

  const handle = slug.replace(/\.html$/, "");

  try {
    const product = await fetchProductByHandle(handle);
    if (!product) return null;
    return shopifyProductToBuyCatalogProduct(product);
  } catch (error) {
    console.error("[shopify] fetchBuyProduct failed:", error);
    return null;
  }
}

export const shopifyCacheOptions = {
  next: { revalidate: REVALIDATE_SECONDS },
};
