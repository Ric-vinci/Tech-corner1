/**
 * The five product categories, for admin filters. Products are tagged
 * `category:<key>` in Shopify; refurb units copy that tag from their source
 * model so they can be filtered the same way.
 */
export const ADMIN_CATEGORIES = [
  { key: "mobile", label: "Phones" },
  { key: "tablets", label: "Tablets" },
  { key: "game-consoles", label: "Game consoles" },
  { key: "smart-watches", label: "Smart watches" },
  { key: "cameras", label: "Cameras" },
] as const;

export type AdminCategoryKey = (typeof ADMIN_CATEGORIES)[number]["key"];

export function isAdminCategory(value: string | undefined): value is AdminCategoryKey {
  return ADMIN_CATEGORIES.some((c) => c.key === value);
}

export function categoryLabel(key: string): string {
  return ADMIN_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

/**
 * Map a sell-side product href (e.g. "/sell-my/mobile/samsung/…") to an admin
 * category key, so a trade-in submission is filed under the right category.
 * Defaults to "mobile" (the bulk of the catalogue) when unknown.
 */
export function categoryFromSellHref(href: string | undefined | null): AdminCategoryKey {
  const seg = (href ?? "").split("/").filter(Boolean)[1] ?? ""; // after "sell-my"
  switch (seg) {
    case "tablets":
      return "tablets";
    case "games-consoles":
    case "game-consoles":
      return "game-consoles";
    case "sell-my-watch":
    case "smart-watches":
      return "smart-watches";
    case "sell-my-camera":
    case "cameras":
      return "cameras";
    default:
      return "mobile";
  }
}
