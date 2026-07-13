import { adminRequest } from "./admin-client";
import {
  ADMIN_COLLECTION_BY_HANDLE_QUERY,
  ADMIN_COLLECTION_PRODUCTS_QUERY,
  ADMIN_COLLECTIONS_QUERY,
  ADMIN_MENU_BY_ID_QUERY,
  ADMIN_MENUS_QUERY,
  ADMIN_PRODUCT_BY_HANDLE_QUERY,
  normalizeAdminCollection,
  normalizeAdminProduct,
  type AdminCollectionNode,
} from "./admin-queries";
import { isShopifyAdminConfigured } from "./config";
import type { ShopifyCollectionNode } from "./collection-mappers";
import type { ShopifyProductNode } from "./mappers";

export async function fetchAdminCollectionByHandle(handle: string): Promise<ShopifyCollectionNode | null> {
  const data = await adminRequest<{ collectionByHandle: AdminCollectionNode | null }>(
    ADMIN_COLLECTION_BY_HANDLE_QUERY,
    { handle },
  );
  if (!data.collectionByHandle) return null;
  return normalizeAdminCollection(data.collectionByHandle);
}

export async function fetchAdminCollections(): Promise<ShopifyCollectionNode[]> {
  const data = await adminRequest<{ collections: { nodes: AdminCollectionNode[] } }>(ADMIN_COLLECTIONS_QUERY, {
    first: 100,
  });
  return (data.collections?.nodes ?? []).map(normalizeAdminCollection);
}

export async function fetchAdminCollectionProducts(handle: string): Promise<ShopifyProductNode[]> {
  const nodes: ShopifyProductNode[] = [];
  let after: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const page: {
      collectionByHandle: {
        products: {
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
          nodes: Parameters<typeof normalizeAdminProduct>[0][];
        };
      } | null;
    } = await adminRequest(ADMIN_COLLECTION_PRODUCTS_QUERY, { handle, first: 250, after });

    if (!page.collectionByHandle) break;

    nodes.push(...page.collectionByHandle.products.nodes.map(normalizeAdminProduct));
    hasNextPage = page.collectionByHandle.products.pageInfo.hasNextPage;
    after = page.collectionByHandle.products.pageInfo.endCursor;
  }

  return nodes;
}

export async function fetchAdminProductByHandle(handle: string): Promise<ShopifyProductNode | null> {
  const data = await adminRequest<{ productByHandle: Parameters<typeof normalizeAdminProduct>[0] | null }>(
    ADMIN_PRODUCT_BY_HANDLE_QUERY,
    { handle },
  );
  if (!data.productByHandle) return null;
  return normalizeAdminProduct(data.productByHandle);
}

const menuIdByHandle = new Map<string, string>();

export async function fetchAdminMenuByHandle(handle: string) {
  if (!menuIdByHandle.size) {
    const data = await adminRequest<{ menus: { nodes: { id: string; handle: string }[] } }>(ADMIN_MENUS_QUERY, {
      first: 50,
    });
    for (const menu of data.menus?.nodes ?? []) {
      menuIdByHandle.set(menu.handle, menu.id);
    }
  }

  const id = menuIdByHandle.get(handle);
  if (!id) return null;

  const data = await adminRequest<{
    menu: {
      items: { title: string; url: string; items?: { title: string; url: string }[] }[];
    } | null;
  }>(ADMIN_MENU_BY_ID_QUERY, { id });

  return data.menu;
}

export function canUseAdminCatalogReads(): boolean {
  return isShopifyAdminConfigured();
}
