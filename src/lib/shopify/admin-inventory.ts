import "server-only";
import { adminRequest, isShopifyAdminConfigured } from "@/lib/shopify/admin-client";
import { resolveImageUrl } from "@/lib/shopify/config";
import { CATALOG_NAMESPACE, METAFIELD_KEYS } from "@/lib/shopify/metafields";
import { afterCursorForPage, countProducts } from "@/lib/shopify/paginate";
import { cleanModelName } from "@/lib/buy/catalog";

const PAGE_SIZE = 25;

/**
 * A refurb *unit* — one physical device Tech Corner owns, created when a trade-in
 * is accepted. This is distinct from a catalogue *model* (which the pricing screen
 * edits): every accepted A10 32GB is its own unit with its own grade and cost.
 */
export type RefurbUnit = {
  id: string;
  handle: string;
  /** Model name with the " (Trade-in Refurb)" suffix stripped. */
  title: string;
  sku: string | null;
  variantId: string | null;
  image: string | null;
  price: number | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  live: boolean;
  createdAt: string;
};

export type RefurbPage = {
  units: RefurbUnit[];
  page: number;
  totalPages: number;
};

const LIST_QUERY = `
  query RefurbInventory($first: Int!, $after: String, $query: String!) {
    products(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        handle
        title
        status
        createdAt
        featuredImage { url }
        imageUrl: metafield(namespace: "${CATALOG_NAMESPACE}", key: "${METAFIELD_KEYS.imageUrl}") { value }
        variants(first: 1) { nodes { id sku price } }
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
      status: RefurbUnit["status"];
      createdAt: string;
      featuredImage: { url: string } | null;
      imageUrl: { value: string } | null;
      variants: { nodes: { id: string; sku: string | null; price: string | null }[] };
    }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

const REFURB_SUFFIX = / \(Trade-in Refurb\)$/;

export async function listRefurbUnits(
  options: { page?: number; category?: string; search?: string; status?: string } = {},
): Promise<RefurbPage> {
  if (!isShopifyAdminConfigured()) return { units: [], page: 1, totalPages: 1 };

  const parts = ["tag:trade-in"];
  if (options.category) parts.push(`tag:"category:${options.category}"`);
  if (options.status === "live") parts.push("status:active");
  if (options.status === "draft") parts.push("status:draft");
  if (options.search?.trim()) parts.push(`title:*${options.search.trim()}*`);
  const query = parts.join(" AND ");
  const page = Math.max(1, options.page ?? 1);

  const [total, after] = await Promise.all([
    countProducts(query),
    afterCursorForPage({ query, page, pageSize: PAGE_SIZE, sortKey: "CREATED_AT", reverse: true }),
  ]);

  const data = await adminRequest<ListResponse>(
    LIST_QUERY,
    { first: PAGE_SIZE, after, query },
    { noStore: true },
  );

  return {
    units: data.products.nodes.map((node) => {
      const variant = node.variants.nodes[0];
      const rawImage = node.imageUrl?.value;
      return {
        id: node.id,
        handle: node.handle,
        title: node.title.replace(REFURB_SUFFIX, ""),
        sku: variant?.sku ?? null,
        variantId: variant?.id ?? null,
        image: rawImage ? resolveImageUrl(rawImage) : node.featuredImage?.url ?? null,
        price: variant?.price != null ? Number(variant.price) : null,
        status: node.status,
        live: node.status === "ACTIVE",
        createdAt: node.createdAt,
      };
    }),
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/** Accurate totals for the stat cards — independent of the current page. */
export async function countRefurbUnits(category?: string): Promise<{ total: number; live: number }> {
  if (!isShopifyAdminConfigured()) return { total: 0, live: 0 };
  const base = ["tag:trade-in"];
  if (category) base.push(`tag:"category:${category}"`);

  const query = `
    query RefurbCounts($all: String!, $live: String!) {
      all: productsCount(query: $all) { count }
      live: productsCount(query: $live) { count }
    }
  `;
  const data = await adminRequest<{ all: { count: number }; live: { count: number } }>(
    query,
    { all: base.join(" AND "), live: [...base, "status:active"].join(" AND ") },
    { noStore: true },
  );
  return { total: data.all.count, live: data.live.count };
}

const PRICE_MUTATION = `
  mutation SetRefurbPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants { id price }
      userErrors { field message }
    }
  }
`;

export async function setRefurbPrice(productId: string, variantId: string, price: number): Promise<void> {
  if (!isShopifyAdminConfigured()) throw new Error("Shopify Admin API is not configured.");

  const data = await adminRequest<{
    productVariantsBulkUpdate: { userErrors: { message: string }[] };
  }>(
    PRICE_MUTATION,
    { productId, variants: [{ id: variantId, price: price.toFixed(2) }] },
    { noStore: true },
  );

  const errors = data.productVariantsBulkUpdate.userErrors ?? [];
  if (errors.length) throw new Error(`Shopify rejected the price: ${errors.map((e) => e.message).join("; ")}`);
}

const STATUS_MUTATION = `
  mutation SetProductStatus($input: ProductInput!) {
    productUpdate(input: $input) {
      product { id status }
      userErrors { field message }
    }
  }
`;

/**
 * Mark refurb units as SOLD once a customer buys them: set Shopify status to
 * ARCHIVED so `status:active` stock queries (storefront + admin counts) stop
 * returning them. One physical unit = one product, so a sold unit leaves stock
 * entirely; when a model's last unit sells, the storefront flips to "Notify when
 * in stock". Best-effort — never throws, so a paid order is never lost if Shopify
 * is briefly unavailable (staff can archive manually from Refurb stock).
 */
export async function markRefurbUnitsSold(productIds: string[]): Promise<void> {
  if (!productIds.length || !isShopifyAdminConfigured()) return;
  const unique = [...new Set(productIds.filter(Boolean))];
  await Promise.all(
    unique.map(async (id) => {
      try {
        await adminRequest(STATUS_MUTATION, { input: { id, status: "ARCHIVED" } }, { noStore: true });
      } catch (err) {
        console.error(`[inventory] markRefurbUnitsSold failed for ${id}:`, err);
      }
    }),
  );
}

/**
 * Count ACTIVE refurb units grouped by their (cleaned) model name — the buy
 * storefront and admin both think in models-with-a-quantity, not per device.
 */
export async function stockCountByModel(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!isShopifyAdminConfigured()) return counts;
  try {
    const data = await adminRequest<{ products: { nodes: { title: string; qty: { value: string } | null }[] } }>(
      `query { products(first: 250, query: "tag:trade-in AND status:active") {
        nodes { title qty: metafield(namespace: "inventory", key: "quantity") { value } }
      } }`,
      undefined,
      { noStore: true },
    );
    for (const n of data.products.nodes) {
      const key = cleanModelName(n.title).toLowerCase();
      const qty = Math.max(1, Math.floor(Number(n.qty?.value ?? 1)) || 1);
      counts.set(key, (counts.get(key) ?? 0) + qty);
    }
  } catch (err) {
    console.error("[inventory] stockCountByModel failed:", err);
  }
  return counts;
}

const PUBLISH_MUTATION = `
  mutation Publish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) { userErrors { message } }
  }
`;

const PUBLICATIONS_QUERY = `{ publications(first: 20) { nodes { id } } }`;

/**
 * Make a refurb unit sellable (ACTIVE + published to every sales channel, so the
 * Storefront API returns it) or hide it again (DRAFT). Publishing is an explicit
 * staff action — accepted units are DRAFT by default so a bare listing never goes
 * live automatically.
 */
export async function setRefurbLive(productId: string, live: boolean): Promise<void> {
  if (!isShopifyAdminConfigured()) throw new Error("Shopify Admin API is not configured.");

  const statusResult = await adminRequest<{ productUpdate: { userErrors: { message: string }[] } }>(
    STATUS_MUTATION,
    { input: { id: productId, status: live ? "ACTIVE" : "DRAFT" } },
    { noStore: true },
  );
  const statusErrors = statusResult.productUpdate.userErrors ?? [];
  if (statusErrors.length) throw new Error(statusErrors.map((e) => e.message).join("; "));

  if (live) {
    const pubs = await adminRequest<{ publications: { nodes: { id: string }[] } }>(
      PUBLICATIONS_QUERY,
      undefined,
      { noStore: true },
    );
    const result = await adminRequest<{ publishablePublish: { userErrors: { message: string }[] } }>(
      PUBLISH_MUTATION,
      { id: productId, input: pubs.publications.nodes.map((p) => ({ publicationId: p.id })) },
      { noStore: true },
    );
    const errors = result.publishablePublish.userErrors ?? [];
    if (errors.length) throw new Error(errors.map((e) => e.message).join("; "));
  }
}
