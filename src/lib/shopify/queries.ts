export const COLLECTION_PRODUCTS_QUERY = `
  query CollectionProducts(
    $handle: String!
    $first: Int!
    $after: String
    $reverse: Boolean!
    $sortKey: ProductCollectionSortKeys
  ) {
    collection(handle: $handle) {
      id
      title
      handle
      products(first: $first, after: $after, reverse: $reverse, sortKey: $sortKey) {
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
          priceRange {
            minVariantPrice {
              amount
            }
          }
          metafields(identifiers: [
            { namespace: "catalog", key: "image_url" },
            { namespace: "catalog", key: "category_slug" },
            { namespace: "catalog", key: "brand_slug" },
            { namespace: "catalog", key: "model_family_slug" },
            { namespace: "catalog", key: "model_family_label" },
            { namespace: "catalog", key: "sell_path" },
            { namespace: "catalog", key: "buy_path" },
            { namespace: "trade_in", key: "price_working" },
            { namespace: "trade_in", key: "price_faulty" },
            { namespace: "trade_in", key: "price_no_power" }
          ]) {
            namespace
            key
            value
          }
        }
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      vendor
      tags
      priceRange {
        minVariantPrice {
          amount
        }
      }
      metafields(identifiers: [
        { namespace: "catalog", key: "image_url" },
        { namespace: "catalog", key: "category_slug" },
        { namespace: "catalog", key: "brand_slug" },
        { namespace: "catalog", key: "model_family_slug" },
        { namespace: "catalog", key: "model_family_label" },
        { namespace: "catalog", key: "sell_path" },
        { namespace: "catalog", key: "buy_path" },
        { namespace: "trade_in", key: "price_working" },
        { namespace: "trade_in", key: "price_faulty" },
        { namespace: "trade_in", key: "price_no_power" }
      ]) {
        namespace
        key
        value
      }
      variants(first: 1) {
        nodes {
          id
        }
      }
    }
  }
`;

export const COLLECTIONS_QUERY = `
  query Collections($first: Int!) {
    collections(first: $first) {
      nodes {
        id
        title
        handle
        description
      }
    }
  }
`;
