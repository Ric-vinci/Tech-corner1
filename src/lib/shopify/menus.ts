import { canUseAdminCatalogReads, fetchAdminMenuByHandle } from "./admin-catalog";
import { isShopifyConfigured, preferStorefrontCatalogReads } from "./config";
import { MENU_BY_HANDLE_QUERY } from "./collection-queries";
import { shopifyMenuToNavItems } from "./collection-mappers";
import { storefrontRequest } from "./storefront-client";
import type { NavItem } from "@/data/types";

type MenuResponse = {
  menu: {
    items: { title: string; url: string; items?: { title: string; url: string }[] }[];
  } | null;
};

export async function fetchSellNavFromShopify(): Promise<NavItem[] | null> {
  return fetchMenuAsNav("sell-main-nav");
}

export async function fetchBuyNavFromShopify(): Promise<NavItem[] | null> {
  return fetchMenuAsNav("buy-main-nav");
}

async function fetchMenuAsNav(handle: string): Promise<NavItem[] | null> {
  if (!isShopifyConfigured()) return null;

  try {
    if (preferStorefrontCatalogReads()) {
      try {
        const data = await storefrontRequest<MenuResponse>(MENU_BY_HANDLE_QUERY, { handle });
        if (data.menu?.items?.length) return shopifyMenuToNavItems(data.menu.items);
      } catch {
        // Storefront menu needs unauthenticated_read_content — fall through to Admin
      }
    }

    if (canUseAdminCatalogReads()) {
      const menu = await fetchAdminMenuByHandle(handle);
      if (menu?.items?.length) return shopifyMenuToNavItems(menu.items);
    }

    const data = await storefrontRequest<MenuResponse>(MENU_BY_HANDLE_QUERY, { handle });
    if (!data.menu?.items?.length) return null;
    return shopifyMenuToNavItems(data.menu.items);
  } catch (error) {
    console.error(`[shopify] fetchMenu(${handle}) failed:`, error);
    return null;
  }
}
