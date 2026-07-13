import "server-only";
import { adminRequest, isShopifyAdminConfigured } from "@/lib/shopify/admin-client";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveImageUrl } from "@/lib/shopify/config";
import { cleanModelName, modelStorageTier, seedImageForTitle } from "@/lib/buy/catalog";
import { coloursForModel } from "@/data/model-colours";
import buySamsungData from "@/data/generated/buy-samsung.json";

/** One buyable unit we hold for a model (a specific graded device). */
export type BuyUnit = {
  variantId: string | null;
  productId: string;
  colour: string | null;
  grade: string | null;
  storage: string | null;
  price: number;
};

export type BuyProductDetail = {
  handle: string;
  modelName: string;
  sku: string;
  image: string;
  fromPrice: number | null;
  units: BuyUnit[];
  colourOptions: { label: string; hex: string }[];
  storageOptions: string[];
  gradeOptions: string[];
  /** Resale price per grade (real for stock, derived otherwise) for the grade buttons. */
  gradePrices: Record<string, number>;
};

const GRADE_OPTIONS = ["Pristine", "Excellent", "Good", "Fair"];
// Grade price factors relative to Pristine (higher grade = higher price).
const GRADE_FACTOR: Record<string, number> = { Pristine: 1, Excellent: 0.94, Good: 0.88, Fair: 0.82 };
const COLOUR_HEX: Record<string, string> = {
  Black: "#19181f", Blue: "#1981e3", White: "#f2f5ff", Green: "#007932", Purple: "#b57dd4", Grey: "#575757",
  Navy: "#060738", Gold: "#e8c469", Cream: "#fff0de", Red: "#f04d58", Yellow: "#ffed91", Orange: "#ff6236",
  Coral: "#EC6952", Lilac: "#c1cced", Mint: "#c2ffbf", Magenta: "#c23ec2", "Ice Blue": "#c2d5ff", Lemon: "#fff7a1",
  Silver: "#cfd4da", Pink: "#f7b6c8", Bronze: "#b08d57", Peach: "#ffc1a6", Olive: "#8a8b5a", Violet: "#b57dd4",
  "Light Blue": "#a9c8ef",
};
const hexFor = (c: string) => COLOUR_HEX[c] ?? "#c1cced";

/**
 * Build the buy product detail for a handle. The page works on the *model*:
 * it lists the option combinations (colour / storage / grade) and marks which
 * ones we actually hold in published stock (only those are buyable).
 */
export async function getBuyProductDetail(handle: string): Promise<BuyProductDetail | null> {
  const cleanHandle = handle.replace(/\.html$/, "");

  // Curated "coming soon" model? (no live product — all options out of stock)
  const curated = (buySamsungData as { name: string; image: string; href: string }[]).find(
    (m) => m.href === `/buy-used/${cleanHandle}.html`,
  );

  let modelName = curated?.name ?? "";
  let image = curated ? resolveImageUrl(curated.image) : "/images/MicrosoftTeams-image_5_.png";

  if (!isShopifyAdminConfigured()) {
    if (!modelName) return null;
    return baseDetail(cleanHandle, modelName, image, []);
  }

  // Resolve the model name + image from the product with this handle (refurb unit).
  if (!modelName) {
    try {
      const byHandle = await adminRequest<{
        productByHandle: { title: string; featuredImage: { url: string } | null; imageUrl: { value: string } | null } | null;
      }>(
        `query($handle: String!) {
          productByHandle(handle: $handle) {
            title
            featuredImage { url }
            imageUrl: metafield(namespace: "catalog", key: "image_url") { value }
          }
        }`,
        { handle: cleanHandle },
        { noStore: true },
      );
      const p = byHandle.productByHandle;
      if (p) {
        modelName = cleanModelName(p.title);
        image = p.imageUrl?.value ? resolveImageUrl(p.imageUrl.value) : p.featuredImage?.url ?? image;
      }
    } catch {
      /* fall through */
    }
  }
  if (!modelName) modelName = cleanModelName(cleanHandle.replace(/-/g, " "));

  // Fetch every ACTIVE refurb unit and keep the ones for this model (small set).
  let units: BuyUnit[] = [];
  try {
    const data = await adminRequest<{
      products: { nodes: { id: string; title: string; featuredImage: { url: string } | null; imageUrl: { value: string } | null; variants: { nodes: { id: string; price: string | null }[] } }[] };
    }>(
      `query { products(first: 250, query: "tag:trade-in AND status:active") {
        nodes { id title featuredImage { url } imageUrl: metafield(namespace: "catalog", key: "image_url") { value } variants(first: 1) { nodes { id price } } }
      } }`,
      undefined,
      { noStore: true },
    );
    const forModel = data.products.nodes.filter((n) => cleanModelName(n.title).toLowerCase() === modelName.toLowerCase());

    // Inspection attributes (colour/grade/storage) per unit.
    const attrs = new Map<string, { colour: string | null; grade: string | null; storage: string | null }>();
    if (forModel.length) {
      try {
        const { data: subs } = await getSupabaseAdmin()
          .from("trade_in_submissions")
          .select("shopify_inventory_product_id, colour, grade, storage")
          .in("shopify_inventory_product_id", forModel.map((n) => n.id));
        for (const s of (subs ?? []) as { shopify_inventory_product_id: string; colour: string | null; grade: string | null; storage: string | null }[]) {
          attrs.set(s.shopify_inventory_product_id, { colour: s.colour, grade: s.grade, storage: s.storage });
        }
      } catch {
        /* pre-migration-006 */
      }
    }

    units = forModel.map((n) => {
      const a = attrs.get(n.id);
      const v = n.variants.nodes[0];
      return {
        variantId: v?.id ?? null,
        productId: n.id,
        colour: a?.colour ?? null,
        grade: a?.grade ?? null,
        storage: a?.storage ?? null,
        price: v?.price ? parseFloat(v.price) : 0,
      };
    });
    // Prefer a unit's real photo; else the seed catalogue photo for this model.
    const withImg = forModel.find((n) => n.imageUrl?.value || n.featuredImage?.url);
    if (withImg) {
      image = withImg.imageUrl?.value ? resolveImageUrl(withImg.imageUrl.value) : withImg.featuredImage!.url;
    } else if (units.length) {
      image = seedImageForTitle(modelName) ?? image;
    }
  } catch {
    /* leave units empty */
  }

  return baseDetail(cleanHandle, modelName, image, units);
}

function baseDetail(handle: string, modelName: string, image: string, units: BuyUnit[]): BuyProductDetail {
  // Real colours for the model ∪ any colour we actually hold in stock (so an
  // in-stock unit's colour always shows). Capped at 8.
  const colourNames = [...new Set([...coloursForModel(modelName), ...(units.map((u) => u.colour).filter(Boolean) as string[])])].slice(0, 8);
  const colourOptions = colourNames.map((label) => ({ label, hex: hexFor(label) }));
  const storageOptions = [...new Set([...modelStorageTier(modelName), ...(units.map((u) => u.storage).filter(Boolean) as string[])])]
    .sort((a, b) => storageGb(a) - storageGb(b));
  const prices = units.map((u) => u.price).filter((p) => p > 0);

  // Per-grade prices: anchor to a real unit's grade/price, derive the rest.
  const anchor = units.find((u) => u.grade && u.price > 0);
  const pristine = anchor ? anchor.price / (GRADE_FACTOR[anchor.grade!] ?? 0.88) : prices.length ? Math.min(...prices) * 1.15 : 0;
  const gradePrices: Record<string, number> = {};
  for (const g of GRADE_OPTIONS) {
    const real = units.find((u) => (u.grade ?? "").toLowerCase() === g.toLowerCase() && u.price > 0);
    gradePrices[g] = real ? real.price : Math.round(pristine * (GRADE_FACTOR[g] ?? 1) * 100) / 100;
  }

  return {
    handle,
    modelName,
    sku: skuFor(modelName),
    image,
    fromPrice: prices.length ? Math.min(...prices) : null,
    units,
    colourOptions,
    storageOptions,
    gradeOptions: GRADE_OPTIONS,
    gradePrices,
  };
}

function skuFor(modelName: string): string {
  return (
    "SAM-" +
    modelName
      .replace(/^Samsung Galaxy\s*/i, "")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toUpperCase()
  );
}

const storageGb = (s: string) => {
  const n = parseFloat(s);
  return /tb/i.test(s) ? n * 1024 : n;
};
