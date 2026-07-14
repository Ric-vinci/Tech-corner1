import "server-only";
import { adminRequest, isShopifyAdminConfigured } from "@/lib/shopify/admin-client";
import { resolveImageUrl } from "@/lib/shopify/config";
import { CATALOG_NAMESPACE, METAFIELD_KEYS } from "@/lib/shopify/metafields";
import { afterCursorForPage, countProducts } from "@/lib/shopify/paginate";
import { cleanModelName, seedImageForTitle } from "@/lib/buy/catalog";

const PAGE_SIZE = 25;

/** Storage size embedded in a refurb title ("… A226B 64GB" → "64GB"). */
export function sizeFromTitle(title: string): string | null {
  const m = title.match(/(\d+)\s*(GB|TB)/i);
  return m ? `${m[1]}${m[2].toUpperCase()}` : null;
}

function slugifyModel(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** One catalogue MODEL rolled up from its refurb units (for the grouped admin view). */
export type RefurbModelSummary = {
  modelName: string;
  slug: string;
  image: string | null;
  unitCount: number; // trade-in batches (products) behind this model
  totalStock: number; // total DEVICES in stock (sum of quantities)
  liveStock: number; // devices that are live on the storefront
  liveCount: number;
  draftCount: number;
  sizes: string[];
  fromPrice: number | null;
};

type ModelNode = {
  id: string;
  title: string;
  status: RefurbUnit["status"];
  featuredImage: { url: string } | null;
  imageUrl: { value: string } | null;
  qty: { value: string } | null;
  variants: { nodes: { price: string | null }[] };
};

const MODEL_FIELDS = `
  id title status
  featuredImage { url }
  imageUrl: metafield(namespace: "${CATALOG_NAMESPACE}", key: "${METAFIELD_KEYS.imageUrl}") { value }
  qty: metafield(namespace: "inventory", key: "quantity") { value }
  variants(first: 1) { nodes { price } }
`;

function refurbQuery(category?: string, search?: string): string {
  const parts = ["tag:trade-in"];
  if (category) parts.push(`tag:"category:${category}"`);
  if (search?.trim()) parts.push(`title:*${search.trim()}*`);
  return parts.join(" AND ");
}

/** All refurb units grouped into catalogue models (Level 1 of the grouped admin view). */
export async function listRefurbModels(options: { category?: string; search?: string } = {}): Promise<RefurbModelSummary[]> {
  if (!isShopifyAdminConfigured()) return [];
  const query = refurbQuery(options.category, options.search);
  const data = await adminRequest<{ products: { nodes: ModelNode[] } }>(
    `query { products(first: 250, query: "${query}", sortKey: CREATED_AT, reverse: true) { nodes { ${MODEL_FIELDS} } } }`,
    undefined,
    { noStore: true },
  );

  const byModel = new Map<string, RefurbModelSummary>();
  for (const n of data.products.nodes) {
    const modelName = cleanModelName(n.title.replace(REFURB_SUFFIX, ""));
    const key = modelName.toLowerCase();
    const qty = Math.max(1, Math.floor(Number(n.qty?.value ?? 1)) || 1);
    const size = sizeFromTitle(n.title);
    const price = Number(n.variants.nodes[0]?.price ?? 0);
    const image = n.imageUrl?.value ? resolveImageUrl(n.imageUrl.value) : n.featuredImage?.url ?? seedImageForTitle(n.title);
    const isLive = n.status === "ACTIVE";
    const m = byModel.get(key);
    if (!m) {
      byModel.set(key, {
        modelName,
        slug: slugifyModel(modelName),
        image,
        unitCount: 1,
        totalStock: qty,
        liveStock: isLive ? qty : 0,
        liveCount: isLive ? 1 : 0,
        draftCount: isLive ? 0 : 1,
        sizes: size ? [size] : [],
        fromPrice: price > 0 ? price : null,
      });
    } else {
      m.unitCount += 1;
      m.totalStock += qty;
      if (isLive) {
        m.liveStock += qty;
        m.liveCount += 1;
      } else m.draftCount += 1;
      if (size && !m.sizes.includes(size)) m.sizes.push(size);
      if (price > 0 && (m.fromPrice == null || price < m.fromPrice)) m.fromPrice = price;
      if (!m.image) m.image = image;
    }
  }
  const sizeGb = (s: string) => (/tb/i.test(s) ? parseFloat(s) * 1024 : parseFloat(s));
  return [...byModel.values()].map((m) => ({ ...m, sizes: m.sizes.sort((a, b) => sizeGb(a) - sizeGb(b)) }));
}

/** Every refurb unit for one model slug (Level 2 — the model detail, grouped by size). */
export async function fetchRefurbUnitsForModel(slug: string, category?: string): Promise<{ modelName: string; units: RefurbUnit[] }> {
  if (!isShopifyAdminConfigured()) return { modelName: "", units: [] };
  const query = refurbQuery(category);
  const data = await adminRequest<{ products: { nodes: (ModelNode & { handle: string; sub: { value: string } | null; variants: { nodes: { id: string; sku: string | null; price: string | null }[] }; createdAt: string })[] } }>(
    `query { products(first: 250, query: "${query}", sortKey: CREATED_AT, reverse: true) {
      nodes { id handle title status createdAt featuredImage { url }
        imageUrl: metafield(namespace: "${CATALOG_NAMESPACE}", key: "${METAFIELD_KEYS.imageUrl}") { value }
        sub: metafield(namespace: "trade_in", key: "submission_id") { value }
        variants(first: 1) { nodes { id sku price } } }
    } }`,
    undefined,
    { noStore: true },
  );

  let modelName = "";
  const units: RefurbUnit[] = [];
  for (const node of data.products.nodes) {
    const clean = cleanModelName(node.title.replace(REFURB_SUFFIX, ""));
    if (slugifyModel(clean) !== slug) continue;
    modelName = clean;
    const variant = node.variants.nodes[0];
    const rawImage = node.imageUrl?.value;
    units.push({
      id: node.id,
      handle: node.handle,
      title: node.title.replace(REFURB_SUFFIX, ""),
      sku: variant?.sku ?? null,
      variantId: variant?.id ?? null,
      image: rawImage ? resolveImageUrl(rawImage) : node.featuredImage?.url ?? seedImageForTitle(node.title),
      price: variant?.price != null ? Number(variant.price) : null,
      status: node.status,
      live: node.status === "ACTIVE",
      createdAt: node.createdAt,
      submissionRef: node.sub?.value ?? null,
    });
  }
  return { modelName, units };
}

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
  /** The trade-in this device came from (submission_id metafield). */
  submissionRef?: string | null;
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

const SET_QTY_MUTATION = `
  mutation SetQty($m: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $m) { userErrors { message } }
  }
`;

/**
 * Reduce refurb stock when a customer buys: each product holds a device-quantity
 * (`inventory.quantity`), so a purchase DECREMENTS it by the amount bought. When
 * the last device of a unit sells (quantity hits 0) the product is ARCHIVED, so
 * the model's stock count drops and — once its last unit is gone — the storefront
 * flips to "Notify when in stock". Best-effort — never throws, so a paid order is
 * never lost if Shopify is briefly unavailable.
 */
export async function markRefurbUnitsSold(sold: { productId: string; qty: number }[]): Promise<void> {
  if (!sold.length || !isShopifyAdminConfigured()) return;
  await Promise.all(
    sold.map(async ({ productId, qty }) => {
      if (!productId) return;
      try {
        const data = await adminRequest<{ node: { qty: { value: string } | null } | null }>(
          `query($id: ID!){ node(id: $id){ ... on Product { qty: metafield(namespace: "inventory", key: "quantity") { value } } } }`,
          { id: productId },
          { noStore: true },
        );
        const current = Math.max(1, Math.floor(Number(data.node?.qty?.value ?? 1)) || 1);
        const next = current - Math.max(1, Math.floor(qty) || 1);
        if (next <= 0) {
          await adminRequest(STATUS_MUTATION, { input: { id: productId, status: "ARCHIVED" } }, { noStore: true });
        } else {
          await adminRequest(
            SET_QTY_MUTATION,
            { m: [{ ownerId: productId, namespace: "inventory", key: "quantity", type: "number_integer", value: String(next) }] },
            { noStore: true },
          );
        }
      } catch (err) {
        console.error(`[inventory] markRefurbUnitsSold failed for ${productId}:`, err);
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
