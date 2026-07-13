export const COLLECTION_BY_HANDLE_QUERY = `
  query CollectionByHandle($handle: String!) {
    collection(handle: $handle) {
      id
      title
      handle
      description
      metafields(identifiers: [
        { namespace: "catalog", key: "category_slug" },
        { namespace: "catalog", key: "parent_handle" },
        { namespace: "catalog", key: "hero_image_url" },
        { namespace: "catalog", key: "brand_logo_url" },
        { namespace: "catalog", key: "card_label" },
        { namespace: "catalog", key: "sell_href" },
        { namespace: "catalog", key: "buy_href" },
        { namespace: "catalog", key: "brand_slug" },
        { namespace: "catalog", key: "layout_type" }
      ]) {
        namespace
        key
        value
      }
    }
  }
`;

export const COLLECTIONS_WITH_METAFIELDS_QUERY = `
  query CollectionsWithMetafields($first: Int!) {
    collections(first: $first) {
      nodes {
        id
        title
        handle
        description
        metafields(identifiers: [
          { namespace: "catalog", key: "category_slug" },
          { namespace: "catalog", key: "parent_handle" },
          { namespace: "catalog", key: "hero_image_url" },
          { namespace: "catalog", key: "brand_logo_url" },
          { namespace: "catalog", key: "card_label" },
          { namespace: "catalog", key: "sell_href" },
          { namespace: "catalog", key: "buy_href" },
          { namespace: "catalog", key: "brand_slug" },
          { namespace: "catalog", key: "layout_type" }
        ]) {
          namespace
          key
          value
        }
      }
    }
  }
`;

export const MENU_BY_HANDLE_QUERY = `
  query MenuByHandle($handle: String!) {
    menu(handle: $handle) {
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
