import type { BrandItem, BuyCollectionConfig, NavItem, SellCategoryConfig } from "@/data/types";
import { resolveImageUrl } from "./config";
import { sellCategoryHandle } from "./category-map";
import { CATALOG_NAMESPACE, getMetafieldValue, METAFIELD_KEYS, type ShopifyMetafield } from "./metafields";

export type ShopifyCollectionNode = {
  id: string;
  title: string;
  handle: string;
  description?: string;
  metafields?: (ShopifyMetafield | null)[] | null;
};

function cleanMetafields(metafields: ShopifyCollectionNode["metafields"]): ShopifyMetafield[] {
  return (metafields ?? []).filter((m): m is ShopifyMetafield => Boolean(m?.namespace && m?.key));
}

function mf(metafields: ShopifyMetafield[], key: string): string | undefined {
  return getMetafieldValue(metafields, CATALOG_NAMESPACE, key);
}

export function shopifyCollectionToBrandItem(node: ShopifyCollectionNode): BrandItem {
  const metafields = cleanMetafields(node.metafields);
  const brandSlug = mf(metafields, METAFIELD_KEYS.brandSlug) ?? node.handle.replace(/-mobile$/, "");
  const logo = mf(metafields, METAFIELD_KEYS.brandLogoUrl);
  const sellHref = mf(metafields, METAFIELD_KEYS.sellHref) ?? `/sell-my/mobile/${brandSlug}`;

  return {
    label: node.title.replace(/ Mobile$/, ""),
    slug: brandSlug,
    href: sellHref,
    image: logo ? resolveImageUrl(logo) : undefined,
    cardLabel: mf(metafields, METAFIELD_KEYS.cardLabel),
    heroImage: mf(metafields, METAFIELD_KEYS.heroImageUrl)
      ? resolveImageUrl(mf(metafields, METAFIELD_KEYS.heroImageUrl)!)
      : undefined,
  };
}

export function shopifyCollectionToSellCategory(
  node: ShopifyCollectionNode,
  brands: BrandItem[] = [],
): SellCategoryConfig {
  const metafields = cleanMetafields(node.metafields);
  const categorySlug = mf(metafields, METAFIELD_KEYS.categorySlug) ?? node.handle;
  const layoutType = mf(metafields, METAFIELD_KEYS.layoutType);
  const hero = mf(metafields, METAFIELD_KEYS.heroImageUrl);

  return {
    slug: categorySlug,
    title: mf(metafields, METAFIELD_KEYS.cardLabel) ?? node.title,
    heading: node.title,
    heroImage: hero ? resolveImageUrl(hero) : resolveImageUrl("/images/MicrosoftTeams-image_5_.png"),
    layout: layoutType === "catalog" ? "catalog" : "brand-picker",
    brands: brands.length ? brands : undefined,
    products: [],
    description: node.description ? [node.description] : [],
  };
}

export function shopifyCollectionToBuyCategory(
  node: ShopifyCollectionNode,
  products: BuyCollectionConfig["products"] = [],
): BuyCollectionConfig {
  const metafields = cleanMetafields(node.metafields);
  const hero = mf(metafields, METAFIELD_KEYS.heroImageUrl);

  return {
    slug: [node.handle],
    title: node.title,
    heading: node.title,
    heroImage: hero ? resolveImageUrl(hero) : resolveImageUrl("/images/MicrosoftTeams-image_5_.png"),
    filters: [],
    products,
    description: node.description ? [node.description] : [],
  };
}

export function filterChildBrandCollections(
  collections: ShopifyCollectionNode[],
  parentHandle: string,
): ShopifyCollectionNode[] {
  return collections.filter((c) => {
    const metafields = cleanMetafields(c.metafields);
    return mf(metafields, METAFIELD_KEYS.parentHandle) === parentHandle;
  });
}

export function collectionHandleForSellSlug(slug: string): string {
  return sellCategoryHandle(slug);
}

export function menuUrlToPath(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname;
  } catch {
    return url.startsWith("/") ? url : `/${url}`;
  }
}

export function shopifyMenuToNavItems(
  items: { title: string; url: string; items?: { title: string; url: string }[] }[],
): NavItem[] {
  return items.map((item) => ({
    label: item.title,
    href: menuUrlToPath(item.url),
    columns: item.items?.length
      ? [
          {
            title: item.title,
            href: menuUrlToPath(item.url),
            links: item.items.map((sub) => ({
              label: sub.title,
              href: menuUrlToPath(sub.url),
            })),
          },
        ]
      : undefined,
  }));
}
