/** Maps sell category slugs to Shopify collection handles. */

export const SELL_CATEGORY_HANDLE: Record<string, string> = {
  mobile: "mobile-phones",
  tablets: "tablets",
  "games-consoles": "games-consoles",
  "sell-my-watch": "smart-watches",
  "sell-my-camera": "cameras",
};

export const BUY_CATEGORY_HANDLE: Record<string, string> = {
  "mobile-phones": "mobile-phones",
  tablets: "tablets",
  "game-consoles": "games-consoles",
  "smart-watches": "smart-watches",
  cameras: "cameras",
  deals: "deals",
  accessories: "accessories",
  "all-refurbished": "all-refurbished",
};

export function sellCategoryHandle(slug: string): string {
  return SELL_CATEGORY_HANDLE[slug] ?? slug;
}

export function brandCollectionHandle(categorySlug: string, brandSlug: string): string {
  if (categorySlug === "mobile") return `${brandSlug}-mobile`;
  return `${brandSlug}-${categorySlug}`;
}
