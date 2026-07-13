import "server-only";
import { adminRequest, isShopifyAdminConfigured } from "@/lib/shopify/admin-client";
import { resolveImageUrl } from "@/lib/shopify/config";
import { CATALOG_NAMESPACE, TRADE_IN_NAMESPACE, METAFIELD_KEYS } from "@/lib/shopify/metafields";
import { afterCursorForPage, countProducts } from "@/lib/shopify/paginate";

const PAGE_SIZE = 25;

export type PricingProduct = {
  id: string;
  handle: string;
  title: string;
  image: string | null;
  priceWorking: number | null;
  priceFaulty: number | null;
  priceNoPower: number | null;
};

export type PricingPage = {
  products: PricingProduct[];
  page: number;
  totalPages: number;
};

const LIST_QUERY = `
  query PricingProducts($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query, sortKey: TITLE) {
      nodes {
        id
        handle
        title
        featuredImage { url }
        imageUrl: metafield(namespace: "${CATALOG_NAMESPACE}", key: "${METAFIELD_KEYS.imageUrl}") { value }
        working: metafield(namespace: "${TRADE_IN_NAMESPACE}", key: "${METAFIELD_KEYS.priceWorking}") { value }
        faulty: metafield(namespace: "${TRADE_IN_NAMESPACE}", key: "${METAFIELD_KEYS.priceFaulty}") { value }
        noPower: metafield(namespace: "${TRADE_IN_NAMESPACE}", key: "${METAFIELD_KEYS.priceNoPower}") { value }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

type ListResponse = {
  products: {
    nodes: {
      id: string;
      handle: string;
      title: string;
      featuredImage: { url: string } | null;
      imageUrl: { value: string } | null;
      working: { value: string } | null;
      faulty: { value: string } | null;
      noPower: { value: string } | null;
    }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

const num = (value: string | undefined | null): number | null => {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Catalogue sell products (excludes the trade-in refurb drafts). */
export async function listPricingProducts(options: {
  page?: number;
  search?: string;
  category?: string;
} = {}): Promise<PricingPage> {
  if (!isShopifyAdminConfigured()) {
    return { products: [], page: 1, totalPages: 1 };
  }

  // Exclude the accepted-trade-in drafts; optionally filter by category / title.
  const parts = ["-tag:trade-in"];
  if (options.category) parts.push(`tag:"category:${options.category}"`);
  if (options.search?.trim()) parts.push(`(title:*${options.search.trim()}* OR handle:*${options.search.trim()}*)`);
  const query = parts.join(" AND ");
  const page = Math.max(1, options.page ?? 1);

  const [total, after] = await Promise.all([
    countProducts(query),
    afterCursorForPage({ query, page, pageSize: PAGE_SIZE, sortKey: "TITLE" }),
  ]);

  const data = await adminRequest<ListResponse>(
    LIST_QUERY,
    { first: PAGE_SIZE, after, query },
    { noStore: true },
  );

  return {
    products: data.products.nodes.map((node) => ({
      id: node.id,
      handle: node.handle,
      title: node.title,
      // Photos live in the catalog.image_url metafield. Private-S3 URLs must be
      // rewritten to the public fallback (same as the storefront), or they 404.
      image: node.imageUrl?.value
        ? resolveImageUrl(node.imageUrl.value)
        : node.featuredImage?.url ?? null,
      priceWorking: num(node.working?.value),
      priceFaulty: num(node.faulty?.value),
      priceNoPower: num(node.noPower?.value),
    })),
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

const SET_MUTATION = `
  mutation SetTradeInPrices($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { key value }
      userErrors { field message }
    }
  }
`;

export type TradeInPriceUpdate = {
  productId: string;
  priceWorking?: number | null;
  priceFaulty?: number | null;
  priceNoPower?: number | null;
};

/**
 * Write the three trade-in price metafields for one product. A `null`/undefined
 * price is left untouched (not cleared), so partial edits are safe.
 */
export async function setTradeInPrices(update: TradeInPriceUpdate): Promise<void> {
  if (!isShopifyAdminConfigured()) throw new Error("Shopify Admin API is not configured.");

  const entries: { key: string; value: number }[] = [];
  if (update.priceWorking != null) entries.push({ key: METAFIELD_KEYS.priceWorking, value: update.priceWorking });
  if (update.priceFaulty != null) entries.push({ key: METAFIELD_KEYS.priceFaulty, value: update.priceFaulty });
  if (update.priceNoPower != null) entries.push({ key: METAFIELD_KEYS.priceNoPower, value: update.priceNoPower });
  if (entries.length === 0) return;

  const data = await adminRequest<{
    metafieldsSet: { userErrors: { field: string[]; message: string }[] };
  }>(
    SET_MUTATION,
    {
      metafields: entries.map((entry) => ({
        ownerId: update.productId,
        namespace: TRADE_IN_NAMESPACE,
        key: entry.key,
        type: "number_decimal",
        value: entry.value.toFixed(2),
      })),
    },
    { noStore: true },
  );

  const errors = data.metafieldsSet.userErrors ?? [];
  if (errors.length) {
    throw new Error(`Shopify rejected the price update: ${errors.map((e) => e.message).join("; ")}`);
  }
}
