/** Metafield namespace/key constants shared by sync scripts and the storefront layer. */

export const CATALOG_NAMESPACE = "catalog";
export const TRADE_IN_NAMESPACE = "trade_in";

export const METAFIELD_KEYS = {
  imageUrl: "image_url",
  categorySlug: "category_slug",
  brandSlug: "brand_slug",
  modelFamilySlug: "model_family_slug",
  modelFamilyLabel: "model_family_label",
  sellPath: "sell_path",
  buyPath: "buy_path",
  heroImageUrl: "hero_image_url",
  brandLogoUrl: "brand_logo_url",
  cardLabel: "card_label",
  sellHref: "sell_href",
  buyHref: "buy_href",
  parentHandle: "parent_handle",
  layoutType: "layout_type",
  priceWorking: "price_working",
  priceFaulty: "price_faulty",
  priceNoPower: "price_no_power",
} as const;

export type ShopifyMetafield = {
  namespace: string;
  key: string;
  value: string;
};

export function getMetafieldValue(
  metafields: ShopifyMetafield[] | null | undefined,
  namespace: string,
  key: string,
): string | undefined {
  return metafields?.find((m) => m.namespace === namespace && m.key === key)?.value;
}

export function getMetafieldNumber(
  metafields: ShopifyMetafield[] | null | undefined,
  namespace: string,
  key: string,
): number | undefined {
  const raw = getMetafieldValue(metafields, namespace, key);
  if (raw == null || raw === "") return undefined;
  const num = Number(raw);
  return Number.isFinite(num) ? num : undefined;
}
