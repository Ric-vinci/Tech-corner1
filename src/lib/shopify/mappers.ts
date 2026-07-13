import type { CatalogProduct, ModelFilterLink, SellProductDetail } from "@/data/types";
import { resolveImageUrl } from "./config";
import { CATALOG_NAMESPACE, getMetafieldNumber, getMetafieldValue, METAFIELD_KEYS, TRADE_IN_NAMESPACE, type ShopifyMetafield } from "./metafields";

export type ShopifyProductNode = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  tags: string[];
  priceRange?: {
    minVariantPrice?: {
      amount: string;
    };
  };
  metafields?: (ShopifyMetafield | null)[] | null;
  variants?: {
    nodes: { id: string }[];
  };
};

function cleanMetafields(metafields: ShopifyProductNode["metafields"]): ShopifyMetafield[] {
  return (metafields ?? []).filter((m): m is ShopifyMetafield => Boolean(m?.namespace && m?.key));
}

export function shopifyProductToCatalogProduct(node: ShopifyProductNode): CatalogProduct {
  const metafields = cleanMetafields(node.metafields);
  const imageUrl = getMetafieldValue(metafields, CATALOG_NAMESPACE, METAFIELD_KEYS.imageUrl);
  const sellPath = getMetafieldValue(metafields, CATALOG_NAMESPACE, METAFIELD_KEYS.sellPath);
  const priceWorking = getMetafieldNumber(metafields, TRADE_IN_NAMESPACE, METAFIELD_KEYS.priceWorking);
  const brandSlug = getMetafieldValue(metafields, CATALOG_NAMESPACE, METAFIELD_KEYS.brandSlug);

  return {
    name: node.title,
    image: resolveImageUrl(imageUrl ?? "/images/MicrosoftTeams-image_5_.png"),
    price: priceWorking != null ? `Get up to £${priceWorking.toFixed(2)}` : "Get a quote",
    href: sellPath ?? `/sell-my/${node.handle}.html`,
    brand: node.vendor || brandSlug,
  };
}

export function shopifyProductToBuyCatalogProduct(node: ShopifyProductNode): CatalogProduct {
  const metafields = cleanMetafields(node.metafields);
  const imageUrl = getMetafieldValue(metafields, CATALOG_NAMESPACE, METAFIELD_KEYS.imageUrl);
  const buyPath = getMetafieldValue(metafields, CATALOG_NAMESPACE, METAFIELD_KEYS.buyPath);
  const amount = node.priceRange?.minVariantPrice?.amount;
  const price = amount ? `£${parseFloat(amount).toFixed(2)}` : "£—";

  return {
    name: node.title,
    image: resolveImageUrl(imageUrl ?? "/images/MicrosoftTeams-image_5_.png"),
    price,
    href: buyPath ?? `/buy-used/${node.handle}.html`,
    brand: node.vendor,
  };
}

export function shopifyProductToSellDetail(node: ShopifyProductNode): SellProductDetail {
  const metafields = cleanMetafields(node.metafields);
  const base = shopifyProductToCatalogProduct(node);
  const categorySlug = getMetafieldValue(metafields, CATALOG_NAMESPACE, METAFIELD_KEYS.categorySlug);
  const brandSlug = getMetafieldValue(metafields, CATALOG_NAMESPACE, METAFIELD_KEYS.brandSlug);
  const familyLabel = getMetafieldValue(metafields, CATALOG_NAMESPACE, METAFIELD_KEYS.modelFamilyLabel);
  const familySlug = getMetafieldValue(metafields, CATALOG_NAMESPACE, METAFIELD_KEYS.modelFamilySlug);

  return {
    ...base,
    shopifyProductId: node.id,
    shopifyVariantId: node.variants?.nodes?.[0]?.id,
    brandSlug,
    categorySlug,
    priceWorking: getMetafieldNumber(metafields, TRADE_IN_NAMESPACE, METAFIELD_KEYS.priceWorking),
    priceFaulty: getMetafieldNumber(metafields, TRADE_IN_NAMESPACE, METAFIELD_KEYS.priceFaulty),
    priceNoPower: getMetafieldNumber(metafields, TRADE_IN_NAMESPACE, METAFIELD_KEYS.priceNoPower),
    familyLabel,
    familyHref: familySlug ? `/sell-my/mobile/${brandSlug ?? "samsung"}/${familySlug}` : undefined,
  };
}

export function buildModelFilterLinks(products: SellProductDetail[]): ModelFilterLink[] {
  const seen = new Set<string>();
  const links: ModelFilterLink[] = [];

  for (const product of products) {
    if (!product.familyLabel || !product.familyHref) continue;
    if (seen.has(product.familyHref)) continue;
    seen.add(product.familyHref);
    links.push({
      label: product.familyLabel,
      href: product.familyHref,
    });
  }

  return links;
}

export { brandCollectionHandle } from "./category-map";
