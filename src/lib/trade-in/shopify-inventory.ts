import { adminRequest, isShopifyAdminConfigured } from "@/lib/shopify/admin-client";
import { CATALOG_NAMESPACE, METAFIELD_KEYS } from "@/lib/shopify/metafields";
import { resolveImageUrl } from "@/lib/shopify/config";
import { refurbDefaultResalePrice } from "@/lib/trade-in/bonus";
import type { TradeInSubmission } from "@/lib/trade-in/types";

/** The source model's photo (resolved to a public URL) — the default inspection photo. */
export async function getModelImageUrl(slug: string | null): Promise<string | null> {
  const { imageUrl } = await sourceProductMeta(slug);
  return imageUrl ? resolveImageUrl(imageUrl) : null;
}

/**
 * Pull the source model's photo and its category/brand tags so the refurb unit
 * shows the device image and can be filtered by category on the admin. Best-effort.
 */
async function sourceProductMeta(
  slug: string | null,
): Promise<{ imageUrl: string | null; categoryTags: string[] }> {
  if (!slug) return { imageUrl: null, categoryTags: [] };
  const handle = slug.replace(/\.html$/, "");
  try {
    const data = await adminRequest<{
      productByHandle: { tags: string[]; imageUrl: { value: string } | null } | null;
    }>(
      `query($handle: String!) {
        productByHandle(handle: $handle) {
          tags
          imageUrl: metafield(namespace: "${CATALOG_NAMESPACE}", key: "${METAFIELD_KEYS.imageUrl}") { value }
        }
      }`,
      { handle },
      { noStore: true },
    );
    const product = data.productByHandle;
    return {
      imageUrl: product?.imageUrl?.value ?? null,
      categoryTags: (product?.tags ?? []).filter((t) => t.startsWith("category:") || t.startsWith("brand:")),
    };
  } catch {
    return { imageUrl: null, categoryTags: [] };
  }
}

const KNOWN_BRANDS = [
  "samsung", "apple", "google", "huawei", "oneplus", "sony", "nokia", "motorola",
  "xiaomi", "oppo", "realme", "honor", "nothing", "lg", "htc", "zte", "blackberry",
  "cat", "razer", "redmi", "hmd",
];

/** Best-effort brand from a product name ("Samsung Galaxy A22 5G" → "samsung"). */
function brandFromName(name: string): string | null {
  const first = name.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!first) return null;
  return KNOWN_BRANDS.includes(first) ? first : first;
}

/**
 * The category and brand tags for a refurb unit. Prefer the source model's tags,
 * but always derive them from the submission (category + product name) so a unit
 * is still filterable/visible even when the source catalogue model is missing.
 */
function refurbTags(submission: TradeInSubmission, sourceTags: string[]): string[] {
  const category = (submission.category ?? "mobile").trim();
  const brand = brandFromName(submission.product_name);
  const derived = [`category:${category}`, ...(brand ? [`brand:${brand}`] : [])];
  return [...new Set(["trade-in", "refurbished", ...sourceTags, ...derived])];
}

const PRODUCT_SET_MUTATION = `
  mutation CreateRefurbProduct($input: ProductSetInput!, $identifier: ProductSetIdentifiers) {
    productSet(synchronous: true, input: $input, identifier: $identifier) {
      product { id handle }
      userErrors { field message }
    }
  }
`;

export async function createShopifyInventoryFromTradeIn(
  submission: TradeInSubmission,
): Promise<string | null> {
  if (!isShopifyAdminConfigured()) return null;
  if (submission.shopify_inventory_product_id) return submission.shopify_inventory_product_id;

  const baseHandle = (submission.product_slug ?? submission.product_name)
    .replace(/\.html$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const handle = `${baseHandle}-ti-${submission.id.slice(0, 8)}`;
  const title = `${submission.product_name} (Trade-in Refurb)`;
  const quantity = Math.max(1, Math.floor(Number(submission.quantity) || 1));
  // Resale price is anchored to the BASE device value (excludes the store-credit
  // bonus). Prefer the stored base; fall back to the per-unit payout for old rows.
  const payoutDetails = (submission.payout_details ?? {}) as { base_unit_price?: number };
  const baseUnit = Number(
    payoutDetails.base_unit_price ?? Number(submission.quoted_price ?? 0) / quantity,
  );
  const price = String(refurbDefaultResalePrice(baseUnit));
  const { imageUrl, categoryTags } = await sourceProductMeta(submission.product_slug);

  const data = await adminRequest<{
    productSet: {
      product: { id: string; handle: string } | null;
      userErrors: { field: string[]; message: string }[];
    };
  }>(PRODUCT_SET_MUTATION, {
    identifier: { handle },
    input: {
      title,
      handle,
      status: "DRAFT",
      productType: "Refurbished Mobile",
      // category:*/brand:* from the source model, plus tags derived from the
      // submission so the unit is always filterable + visible on the storefront.
      tags: refurbTags(submission, categoryTags),
      // Stock quantity (how many identical devices this trade-in covers) + the
      // device photo so refurb stock isn't imageless.
      metafields: [
        { namespace: "inventory", key: "quantity", type: "number_integer", value: String(quantity) },
        ...(imageUrl ? [{ namespace: CATALOG_NAMESPACE, key: METAFIELD_KEYS.imageUrl, type: "url", value: imageUrl }] : []),
      ],
      variants: [
        {
          price,
          sku: `TI-${submission.id.slice(0, 8).toUpperCase()}`,
          optionValues: [{ optionName: "Title", name: "Default Title" }],
        },
      ],
      productOptions: [{ name: "Title", values: [{ name: "Default Title" }] }],
    },
  });

  const errors = data.productSet.userErrors ?? [];
  if (errors.length) {
    throw new Error(`Shopify productSet failed: ${JSON.stringify(errors)}`);
  }

  return data.productSet.product?.id ?? null;
}
