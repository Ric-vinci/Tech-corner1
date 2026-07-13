import { adminRequest } from "./admin-client.mjs";
import { BUY_MENU_ITEMS, SELL_MENU_ITEMS } from "./catalog-data.mjs";

const MENUS_QUERY = `
  query Menus($first: Int!) {
    menus(first: $first) {
      nodes { id handle title }
    }
  }
`;

const MENU_CREATE = `
  mutation MenuCreate($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
    menuCreate(title: $title, handle: $handle, items: $items) {
      menu { id handle title }
      userErrors { field message }
    }
  }
`;

const MENU_UPDATE = `
  mutation MenuUpdate($id: ID!, $title: String!, $items: [MenuItemUpdateInput!]!) {
    menuUpdate(id: $id, title: $title, items: $items) {
      menu { id handle title }
      userErrors { field message }
    }
  }
`;

function toMenuItems(items) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://placeholder.local").replace(/\/$/, "");
  return items.map((item) => ({
    title: item.title,
    type: "HTTP",
    url: item.url.startsWith("http") ? item.url : `${base}${item.url}`,
  }));
}

async function upsertMenu({ handle, title, items }) {
  const data = await adminRequest(MENUS_QUERY, { first: 50 });
  const existing = data.menus?.nodes?.find((m) => m.handle === handle);

  const menuItems = toMenuItems(items);

  if (existing) {
    const result = await adminRequest(MENU_UPDATE, {
      id: existing.id,
      title,
      items: menuItems.map((item) => ({ ...item, id: null })),
    });
    const errors = result.menuUpdate?.userErrors ?? [];
    if (errors.length) throw new Error(`menuUpdate(${handle}): ${JSON.stringify(errors)}`);
    return { handle, action: "updated" };
  }

  const result = await adminRequest(MENU_CREATE, { title, handle, items: menuItems });
  const errors = result.menuCreate?.userErrors ?? [];
  if (errors.length) throw new Error(`menuCreate(${handle}): ${JSON.stringify(errors)}`);
  return { handle, action: "created" };
}

export async function ensureMenus() {
  console.log("Ensuring Shopify menus...");

  try {
    const sell = await upsertMenu({
      handle: "sell-main-nav",
      title: "Sell Main Navigation",
      items: SELL_MENU_ITEMS,
    });
    console.log(`  ${sell.handle}: ${sell.action}`);
  } catch (error) {
    console.warn("  sell-main-nav: skipped —", error.message);
    console.warn("  Add Admin API scope read/write_online_store_navigation or create menu manually in Shopify Admin.");
  }

  try {
    const buy = await upsertMenu({
      handle: "buy-main-nav",
      title: "Buy Main Navigation",
      items: BUY_MENU_ITEMS,
    });
    console.log(`  ${buy.handle}: ${buy.action}`);
  } catch (error) {
    console.warn("  buy-main-nav: skipped —", error.message);
  }
}
