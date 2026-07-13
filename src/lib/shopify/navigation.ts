import { megaNav, sellNav } from "@/data/navigation";
import { fetchBuyNavFromShopify, fetchSellNavFromShopify } from "@/lib/shopify/menus";
import type { NavItem, StoreMode } from "@/data/types";

/**
 * Shopify menus are flat (top-level items only), so a Shopify-driven nav has no
 * `columns` and the hover mega-menu has nothing to show. Restore the rich brand/
 * model columns from the static nav, matched by label — Shopify still owns the
 * top-level ordering/labels; the static data just fills in the dropdown content.
 */
function enrichWithColumns(items: NavItem[], fallback: NavItem[]): NavItem[] {
  const byLabel = new Map(fallback.map((f) => [f.label.trim().toLowerCase(), f]));
  return items.map((item) => {
    if (item.columns?.length) return item;
    const match = byLabel.get(item.label.trim().toLowerCase());
    if (!match?.columns?.length) return item;
    return { ...item, columns: match.columns, footerLinks: item.footerLinks ?? match.footerLinks };
  });
}

export async function getNavForStore(store: StoreMode): Promise<NavItem[]> {
  const fallback = store === "sell" ? sellNav : megaNav;
  const fromShopify = store === "sell" ? await fetchSellNavFromShopify() : await fetchBuyNavFromShopify();
  if (fromShopify?.length) return enrichWithColumns(fromShopify, fallback);
  return fallback;
}
