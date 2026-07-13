import {
  canUseAdminCatalogReads,
  fetchAdminCollectionByHandle,
  fetchAdminCollections,
  fetchAdminCollectionProducts,
} from "./admin-catalog";
import { isShopifyConfigured, preferStorefrontCatalogReads } from "./config";
import { COLLECTION_BY_HANDLE_QUERY, COLLECTIONS_WITH_METAFIELDS_QUERY } from "./collection-queries";
import { storefrontRequest } from "./storefront-client";
import {
  collectionHandleForSellSlug,
  filterChildBrandCollections,
  shopifyCollectionToBrandItem,
  shopifyCollectionToBuyCategory,
  shopifyCollectionToSellCategory,
  type ShopifyCollectionNode,
} from "./collection-mappers";
import type { BrandItem, BuyCollectionConfig, SellCategoryConfig } from "@/data/types";
import { normalizeMobileBrands } from "@/data/mobile-brands";
import { brandCollectionHandle } from "./category-map";
import { shopifyProductToBuyCatalogProduct, shopifyProductToCatalogProduct } from "./mappers";

type CollectionByHandleResponse = {
  collection: ShopifyCollectionNode | null;
};

type CollectionsResponse = {
  collections: { nodes: ShopifyCollectionNode[] };
};

let collectionsCache: ShopifyCollectionNode[] | null = null;

async function fetchCollectionByHandleFromStorefront(handle: string): Promise<ShopifyCollectionNode | null> {
  const data = await storefrontRequest<CollectionByHandleResponse>(COLLECTION_BY_HANDLE_QUERY, { handle });
  return data.collection;
}

async function fetchAllCollectionsFromStorefront(): Promise<ShopifyCollectionNode[]> {
  const data = await storefrontRequest<CollectionsResponse>(COLLECTIONS_WITH_METAFIELDS_QUERY, { first: 100 });
  return data.collections?.nodes ?? [];
}

export async function fetchAllCollections(): Promise<ShopifyCollectionNode[]> {
  if (!isShopifyConfigured()) return [];
  if (collectionsCache) return collectionsCache;

  if (preferStorefrontCatalogReads()) {
    collectionsCache = await fetchAllCollectionsFromStorefront();
    if (collectionsCache.length > 1 || collectionsCache.some((c) => c.handle !== "frontpage")) {
      return collectionsCache;
    }
  }

  if (canUseAdminCatalogReads()) {
    collectionsCache = await fetchAdminCollections();
    return collectionsCache;
  }

  collectionsCache ??= await fetchAllCollectionsFromStorefront();
  return collectionsCache;
}

export async function fetchCollectionByHandle(handle: string): Promise<ShopifyCollectionNode | null> {
  if (!isShopifyConfigured()) return null;

  if (preferStorefrontCatalogReads()) {
    const fromStorefront = await fetchCollectionByHandleFromStorefront(handle);
    if (fromStorefront) return fromStorefront;
  }

  if (canUseAdminCatalogReads()) {
    return fetchAdminCollectionByHandle(handle);
  }

  return fetchCollectionByHandleFromStorefront(handle);
}

export async function fetchSellCategoryFromShopify(slug: string): Promise<SellCategoryConfig | null> {
  if (!isShopifyConfigured()) return null;

  try {
    const handle = collectionHandleForSellSlug(slug);
    const collection = await fetchCollectionByHandle(handle);
    if (!collection) return null;

    let brands: BrandItem[] = [];
    if (slug === "mobile") {
      const all = await fetchAllCollections();
      brands = normalizeMobileBrands(
        filterChildBrandCollections(all, handle).map(shopifyCollectionToBrandItem),
      );
    }

    const config = shopifyCollectionToSellCategory(collection, brands);

    if (config.layout === "catalog") {
      const productNodes = preferStorefrontCatalogReads()
        ? await import("./catalog").then((m) => m.fetchAllCollectionProducts(handle))
        : canUseAdminCatalogReads()
          ? await fetchAdminCollectionProducts(handle)
          : await import("./catalog").then((m) => m.fetchAllCollectionProducts(handle));
      config.products = productNodes.map(shopifyProductToCatalogProduct);
    }

    return config;
  } catch (error) {
    console.error("[shopify] fetchSellCategory failed:", error);
    return null;
  }
}

export async function fetchBrandMetaFromShopify(
  categorySlug: string,
  brandSlug: string,
): Promise<{ pageTitle: string; heroImage?: string } | null> {
  if (!isShopifyConfigured()) return null;

  try {
    const handle = brandCollectionHandle(categorySlug, brandSlug);
    const collection = await fetchCollectionByHandle(handle);
    if (!collection) return null;

    const brand = shopifyCollectionToBrandItem(collection);
    return {
      pageTitle: brand.cardLabel ?? `Trade In Your ${brand.label} Mobile Phone`,
      heroImage: brand.heroImage,
    };
  } catch (error) {
    console.error("[shopify] fetchBrandMeta failed:", error);
    return null;
  }
}

export async function fetchBuyCollectionFromShopify(slug: string[]): Promise<BuyCollectionConfig | null> {
  if (!isShopifyConfigured()) return null;

  try {
    const handle = slug.length === 2 ? brandCollectionHandle("mobile", slug[1]) : slug[0];
    const collection = await fetchCollectionByHandle(handle);
    if (!collection) return null;

    const productNodes = preferStorefrontCatalogReads()
      ? await import("./catalog").then((m) => m.fetchAllCollectionProducts(handle))
      : canUseAdminCatalogReads()
        ? await fetchAdminCollectionProducts(handle)
        : await import("./catalog").then((m) => m.fetchAllCollectionProducts(handle));
    const products = productNodes.map(shopifyProductToBuyCatalogProduct);

    const buyConfig = shopifyCollectionToBuyCategory(collection, products);
    if (slug.length === 2) {
      buyConfig.slug = slug;
      buyConfig.title = `${slug[1].charAt(0).toUpperCase() + slug[1].slice(1)} — ${buyConfig.title}`;
      buyConfig.heading = buyConfig.title;
    }

    return buyConfig;
  } catch (error) {
    console.error("[shopify] fetchBuyCollection failed:", error);
    return null;
  }
}

export function invalidateCollectionsCache() {
  collectionsCache = null;
}
