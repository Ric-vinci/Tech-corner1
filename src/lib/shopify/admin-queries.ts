import type { ShopifyMetafield } from "./metafields";

const METAFIELD_FRAGMENT = `
  metafields(first: 20) {
    nodes {
      namespace
      key
      value
    }
  }
`;

export const ADMIN_COLLECTION_PRODUCTS_COUNT_QUERY = `
  query AdminCollectionProductCount($handle: String!) {
    collectionByHandle(handle: $handle) {
      productsCount
    }
  }
`;

export const ADMIN_COLLECTION_BY_HANDLE_QUERY = `
  query AdminCollectionByHandle($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
      title
      handle
      description
      ${METAFIELD_FRAGMENT}
    }
  }
`;

export const ADMIN_COLLECTIONS_QUERY = `
  query AdminCollections($first: Int!) {
    collections(first: $first) {
      nodes {
        id
        title
        handle
        description
        ${METAFIELD_FRAGMENT}
      }
    }
  }
`;

export const ADMIN_COLLECTION_PRODUCTS_QUERY = `
  query AdminCollectionProducts($handle: String!, $first: Int!, $after: String) {
    collectionByHandle(handle: $handle) {
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          handle
          title
          vendor
          tags
          priceRangeV2 {
            minVariantPrice {
              amount
            }
          }
          ${METAFIELD_FRAGMENT}
          variants(first: 1) {
            nodes {
              id
            }
          }
        }
      }
    }
  }
`;

export const ADMIN_PRODUCT_BY_HANDLE_QUERY = `
  query AdminProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      handle
      title
      vendor
      tags
      priceRangeV2 {
        minVariantPrice {
          amount
        }
      }
      ${METAFIELD_FRAGMENT}
      variants(first: 1) {
        nodes {
          id
        }
      }
    }
  }
`;

export const ADMIN_MENUS_QUERY = `
  query AdminMenus($first: Int!) {
    menus(first: $first) {
      nodes {
        id
        handle
        title
      }
    }
  }
`;

export const ADMIN_MENU_BY_ID_QUERY = `
  query AdminMenuById($id: ID!) {
    menu(id: $id) {
      id
      handle
      title
      items {
        title
        url
        items {
          title
          url
        }
      }
    }
  }
`;

type AdminMetafieldsConnection = {
  nodes: ShopifyMetafield[];
};

export type AdminCollectionNode = {
  id: string;
  title: string;
  handle: string;
  description?: string;
  metafields?: AdminMetafieldsConnection | null;
};

export type AdminProductNode = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  tags: string[];
  priceRangeV2?: {
    minVariantPrice?: {
      amount: string;
    };
  };
  metafields?: AdminMetafieldsConnection | null;
  variants?: {
    nodes: { id: string }[];
  };
};

export function normalizeAdminCollection(node: AdminCollectionNode) {
  return {
    ...node,
    metafields: node.metafields?.nodes ?? [],
  };
}

export function normalizeAdminProduct(node: AdminProductNode) {
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    vendor: node.vendor,
    tags: node.tags,
    priceRange: node.priceRangeV2
      ? { minVariantPrice: node.priceRangeV2.minVariantPrice }
      : undefined,
    metafields: node.metafields?.nodes ?? [],
    variants: node.variants,
  };
}
