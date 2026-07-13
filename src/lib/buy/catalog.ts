import type { CatalogProduct, ModelFilterLink } from "@/data/types";
import { fetchBuyCollectionFromShopify } from "@/lib/shopify/collections";
import { buyCollections } from "@/data/buy-catalog";
import { allowStaticCatalogFallback, resolveImageUrl } from "@/lib/shopify/config";
import { adminRequest, isShopifyAdminConfigured } from "@/lib/shopify/admin-client";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { SellCatalogParams } from "@/lib/sell/catalog-params";
import buySamsungData from "@/data/generated/buy-samsung.json";
import samsungMobileData from "@/data/generated/samsung-mobile.json";

/**
 * A refurb unit created without a source catalogue model has no image, so the
 * storefront card would show a generic placeholder. Resolve the real device photo
 * from the seed catalogue by model name so the buy card matches the sell card.
 */
const SEED_MODEL_IMAGES: Map<string, string> = (() => {
  const map = new Map<string, string>();
  const add = (name: string, image: string) => {
    if (!name || !image) return;
    const full = name.toLowerCase();
    const model = cleanModelName(name).toLowerCase();
    if (!map.has(full)) map.set(full, image);
    if (!map.has(model)) map.set(model, image); // model-level (storage stripped)
  };
  for (const p of (samsungMobileData as { products?: { name: string; image: string }[] }).products ?? []) add(p.name, p.image);
  for (const m of buySamsungData as { name: string; image: string }[]) add(m.name, m.image);
  return map;
})();

/** Device photo for a refurb unit's title/model, from the seed catalogue (or null). */
export function seedImageForTitle(title: string): string | null {
  const clean = title.replace(/\s*\(Trade-in Refurb\)\s*$/i, "").trim();
  const hit = SEED_MODEL_IMAGES.get(clean.toLowerCase()) ?? SEED_MODEL_IMAGES.get(cleanModelName(clean).toLowerCase());
  return hit ? resolveImageUrl(hit) : null;
}

/**
 * The buy storefront lists one clean listing per *model* (e.g. "Samsung Galaxy
 * A22 5G"), unlike the sell side which lists a row per storage variant
 * ("… - A226B 64GB"). This strips the trailing model-number / storage so the
 * per-storage rows collapse to a single buy listing, matching 4gadgets.
 */
export function cleanModelName(name: string): string {
  return name
    .replace(/\s*\(Trade-in Refurb\)\s*$/i, "") // refurb-unit suffix
    .replace(/\s*-\s*[A-Za-z0-9()/.\- ]+?\s*\d+\s*(?:GB|TB)\s*$/i, "") // "- A226B 64GB"
    .replace(/\s+\d+\s*(?:GB|TB)\s*$/i, "") // bare trailing "32GB"
    .replace(/\s*-\s*[A-Za-z0-9()/.\-]+\s*$/i, "") // leftover "- A217F-DS"
    .trim();
}

const priceValue = (p: string): number => parseFloat(p.match(/([\d.]+)/)?.[1] ?? "0");

// ---- Representative model specs -------------------------------------------
// Every buy listing carries available colours/grades/storages so the sidebar
// filters narrow the whole catalogue regardless of stock. Storage is tier-based
// (realistic); colour/grade are deterministic picks so different models differ.
// Matches the sidebar swatches (COLOUR_OPTIONS) so every swatch narrows to some items.
const SPEC_COLOURS = ["Black", "Blue", "Green", "Purple", "Grey", "Gold", "Navy", "Cream", "Red", "Yellow", "Orange", "Coral", "Lilac", "Mint", "Magenta"];
const SPEC_GRADES = ["Pristine", "Excellent", "Good", "Fair"];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const pick = <T,>(arr: T[], seed: string): T => arr[hashStr(seed) % arr.length];

/** Storage tiers a model ships in — we assign ONE deterministically. */
export function modelStorageTier(name: string): string[] {
  const n = name.toLowerCase();
  if (/ultra|z fold|fold\d/.test(n)) return ["256GB", "512GB", "1TB"];
  if (/note|z flip|flip\d|plus|\bs\d/.test(n)) return ["128GB", "256GB"];
  if (/\ba(1\d|2\d|0\d)\b/.test(n)) return ["64GB", "128GB"];
  return ["64GB", "128GB", "256GB"];
}

/**
 * ONE colour / grade / storage per listing (like a single device) so the filters
 * partition cleanly — each item matches exactly one value per attribute. A known
 * in-stock inspection value overrides the generated one.
 */
function specsFor(name: string, over?: { colour?: string | null; grade?: string | null; storage?: string | null }) {
  return {
    colours: [over?.colour || pick(SPEC_COLOURS, name + "|c")],
    grades: [over?.grade || pick(SPEC_GRADES, name + "|g")],
    storages: [over?.storage || pick(modelStorageTier(name), name + "|s")],
  };
}

/** Collapse per-storage variant rows into one listing per model (cheapest = "from" price). */
function collapseToModels(products: CatalogProduct[], inStockKeys: Set<string>): CatalogProduct[] {
  const byModel = new Map<string, CatalogProduct>();
  for (const p of products) {
    const name = cleanModelName(p.name);
    const key = name.toLowerCase();
    const existing = byModel.get(key);
    if (!existing) {
      byModel.set(key, {
        name,
        image: p.image,
        price: p.price,
        href: `/buy-used/${slugifyModel(name)}.html`,
        brand: p.brand,
        inStock: inStockKeys.has(key),
        ...specsFor(name),
      });
    } else if (priceValue(p.price) > 0 && priceValue(p.price) < priceValue(existing.price)) {
      existing.price = p.price; // keep the lowest "from" price across storages
    }
  }
  return [...byModel.values()];
}

function slugifyModel(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Published refurb units we actually own for this brand (ACTIVE + tagged trade-in),
 * as buyable buy-storefront cards. These are the *in-stock* items — shown first.
 */
async function fetchInStockUnits(brand: string): Promise<CatalogProduct[]> {
  if (!isShopifyAdminConfigured()) return [];
  try {
    const query = `tag:trade-in AND status:active AND tag:"brand:${brand}"`;
    const data = await adminRequest<{
      products: {
        nodes: {
          id: string;
          title: string;
          handle: string;
          featuredImage: { url: string } | null;
          imageUrl: { value: string } | null;
          qty: { value: string } | null;
          variants: { nodes: { price: string | null }[] };
        }[];
      };
    }>(
      `query InStock($query: String!) {
        products(first: 250, query: $query) {
          nodes {
            id
            title
            handle
            featuredImage { url }
            imageUrl: metafield(namespace: "catalog", key: "image_url") { value }
            qty: metafield(namespace: "inventory", key: "quantity") { value }
            variants(first: 1) { nodes { price } }
          }
        }
      }`,
      { query },
      { noStore: true },
    );

    // Join each unit to its source submission for the inspection attributes
    // (grade / colour / storage) so the sidebar filters can act on real stock.
    const ids = data.products.nodes.map((n) => n.id);
    const attrs = new Map<string, { grade: string | null; colour: string | null; storage: string | null }>();
    if (ids.length) {
      // Best-effort: tolerate the pre-migration-006 schema (no inspection columns).
      try {
        const { data: subs } = await getSupabaseAdmin()
          .from("trade_in_submissions")
          .select("shopify_inventory_product_id, grade, colour, storage")
          .in("shopify_inventory_product_id", ids);
        for (const s of (subs ?? []) as { shopify_inventory_product_id: string; grade: string | null; colour: string | null; storage: string | null }[]) {
          attrs.set(s.shopify_inventory_product_id, { grade: s.grade, colour: s.colour, storage: s.storage });
        }
      } catch {
        /* inspection columns not present yet */
      }
    }

    // Collapse units to ONE listing per model with a stock count (the storefront
    // lists models, not devices). Multiple units of the same model → one card,
    // count = how many we hold, price = cheapest, specs = union of each unit's.
    const byModel = new Map<string, CatalogProduct>();
    for (const n of data.products.nodes) {
      const amount = n.variants.nodes[0]?.price ? parseFloat(n.variants.nodes[0].price!) : 0;
      const a = attrs.get(n.id);
      const name = cleanModelName(n.title);
      const key = name.toLowerCase();
      const unitQty = Math.max(1, Math.floor(Number(n.qty?.value ?? 1)) || 1); // stock qty per unit
      const spec = specsFor(name, a); // real inspection value wins, else representative
      const existing = byModel.get(key);
      if (!existing) {
        byModel.set(key, {
          name,
          image: n.imageUrl?.value ? resolveImageUrl(n.imageUrl.value) : n.featuredImage?.url ?? seedImageForTitle(n.title) ?? "/images/MicrosoftTeams-image_5_.png",
          price: amount ? `£${amount.toFixed(2)}` : "£—",
          href: `/buy-used/${n.handle}.html`,
          brand,
          inStock: true,
          stockCount: unitQty,
          ...spec,
        });
      } else {
        existing.stockCount = (existing.stockCount ?? 1) + unitQty;
        if (amount > 0 && (priceValue(existing.price) === 0 || amount < priceValue(existing.price))) {
          existing.price = `£${amount.toFixed(2)}`;
        }
        existing.colours = [...new Set([...(existing.colours ?? []), ...spec.colours])];
        existing.grades = [...new Set([...(existing.grades ?? []), ...spec.grades])];
        existing.storages = [...new Set([...(existing.storages ?? []), ...spec.storages])];
      }
    }
    return [...byModel.values()];
  } catch {
    return [];
  }
}

/** The curated buy catalog for a brand — the "shop window" models we list for sale. */
function curatedBuyModels(brand: string): CatalogProduct[] {
  if (brand === "samsung") {
    return (buySamsungData as { name: string; price: string; image: string; href: string }[]).map((m) => ({
      name: m.name,
      image: resolveImageUrl(m.image),
      price: m.price,
      href: m.href,
      brand: "samsung",
      inStock: false,
      ...specsFor(m.name),
    }));
  }
  return [];
}

export type BuyBrandMeta = { pageTitle: string; heroImage: string };

const FALLBACK_HERO = "/images/buy-brands/Mobile_Phones_-_ALL.png";

const BRAND_META: Record<string, BuyBrandMeta> = {
  samsung: { pageTitle: "Refurbished Samsung Mobile Phones", heroImage: "/images/Mobile_Phones_-_Samsung_Child__1_2.png" },
  apple: { pageTitle: "Refurbished Apple Mobile Phones", heroImage: FALLBACK_HERO },
  google: { pageTitle: "Refurbished Google Mobile Phones", heroImage: FALLBACK_HERO },
  huawei: { pageTitle: "Refurbished Huawei Mobile Phones", heroImage: FALLBACK_HERO },
  oneplus: { pageTitle: "Refurbished OnePlus Mobile Phones", heroImage: FALLBACK_HERO },
  "all-phones": { pageTitle: "Used & Refurbished Phones", heroImage: FALLBACK_HERO },
};

export function getBuyBrandMeta(brand: string): BuyBrandMeta {
  return BRAND_META[brand] ?? {
    pageTitle: `Refurbished ${brand.charAt(0).toUpperCase() + brand.slice(1)} Mobile Phones`,
    heroImage: FALLBACK_HERO,
  };
}

/** Samsung Galaxy families, in the order the reference sidebar lists them. */
const SAMSUNG_FAMILIES: { slug: string; label: string; test: RegExp }[] = [
  { slug: "s-range", label: "Samsung Galaxy S Range", test: /galaxy s\d/i },
  { slug: "a-range", label: "Samsung Galaxy A Range", test: /galaxy a\d/i },
  { slug: "note-range", label: "Samsung Galaxy Note Range", test: /galaxy note/i },
  { slug: "z-range", label: "Samsung Galaxy Z Range", test: /galaxy z/i },
  { slug: "m-range", label: "Samsung Galaxy M Range", test: /galaxy m\d/i },
  { slug: "j-range", label: "Samsung Galaxy J Range", test: /galaxy j\d/i },
];

function familiesForBrand(brand: string) {
  return brand === "samsung" ? SAMSUNG_FAMILIES : [];
}

/** Sidebar "Model" links — one per family that actually has stock. */
export function buyBrandModelLinks(brand: string, products: CatalogProduct[], basePath: string): ModelFilterLink[] {
  return familiesForBrand(brand)
    .map((f) => ({ family: f, count: products.filter((p) => f.test.test(p.name)).length }))
    .filter(({ count }) => count > 0)
    .map(({ family, count }) => ({
      slug: family.slug,
      label: family.label,
      href: `${basePath}?model=${family.slug}`,
      count,
    }));
}

function applyModelFilter(brand: string, products: CatalogProduct[], model?: string): CatalogProduct[] {
  if (!model) return products;
  const family = familiesForBrand(brand).find((f) => f.slug === model);
  return family ? products.filter((p) => family.test.test(p.name)) : products;
}

function sortProducts(products: CatalogProduct[], sort: SellCatalogParams["sort"]): CatalogProduct[] {
  const sorted = [...products];
  if (sort === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "low_to_high" || sort === "high_to_low") {
    const price = (p: CatalogProduct) => parseFloat(p.price.match(/([\d.]+)/)?.[1] ?? "0");
    sorted.sort((a, b) => (sort === "low_to_high" ? price(a) - price(b) : price(b) - price(a)));
  }
  return sorted;
}

export type BuyCatalogFilters = {
  model?: string;
  priceMin?: number;
  priceMax?: number;
  colour?: string[];
  grade?: string[];
  storage?: string[];
};

/** Static filter option lists (mirrors the 4gadgets sidebar). */
export const GRADE_OPTIONS = ["Pristine", "Excellent", "Good", "Fair"];
export const STORAGE_OPTIONS = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"];
export const COLOUR_OPTIONS: { label: string; hex: string }[] = [
  { label: "Yellow", hex: "#ffed91" }, { label: "Blue", hex: "#1981e3" }, { label: "Black", hex: "#19181f" },
  { label: "Navy", hex: "#060738" }, { label: "Purple", hex: "#b57dd4" }, { label: "Orange", hex: "#ff6236" },
  { label: "Red", hex: "#f04d58" }, { label: "Cream", hex: "#fff0de" }, { label: "Grey", hex: "#575757" },
  { label: "Green", hex: "#007932" }, { label: "Coral", hex: "#EC6952" }, { label: "Lilac", hex: "#c1cced" },
  { label: "Mint", hex: "#c2ffbf" }, { label: "Magenta", hex: "#c23ec2" }, { label: "Gold", hex: "#fff7a1" },
];

export type BuyBrandCatalogPage = {
  products: CatalogProduct[];
  topSelling: CatalogProduct[];
  modelLinks: ModelFilterLink[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  from: number;
  to: number;
  showingAll: boolean;
  sort: SellCatalogParams["sort"];
  filters: BuyCatalogFilters;
  priceBounds: { min: number; max: number };
};

export async function getBuyBrandCatalogPage(
  brand: string,
  params: SellCatalogParams,
  filters: BuyCatalogFilters = {},
): Promise<BuyBrandCatalogPage | null> {
  // (in-stock units carry grade/colour/storage from inspection; filters act on them)
  // The buy storefront lists a curated set of resale models ("shop window"),
  // with the models we actually hold in published refurb stock shown FIRST and
  // buyable; everything else shows "Notify when in stock".
  // The curated "shop window" (47 Samsung models) always shows as model listings;
  // models we hold in live stock render buyable/"in stock", the rest show
  // "Notify when in stock". Live devices are the ACTIVE refurb units below.
  let curated = curatedBuyModels(brand);
  if (curated.length === 0) {
    // Brands without a curated list fall back to collapsing the sell catalog.
    const collection =
      (await fetchBuyCollectionFromShopify(["mobile-phones", brand])) ??
      (allowStaticCatalogFallback() ? buyCollections["mobile-phones"] : undefined);
    if (!collection) return null;
    curated = collapseToModels(collection.products, new Set());
  }

  const inStock = await fetchInStockUnits(brand);
  const inStockKeys = new Set(inStock.map((u) => u.name.toLowerCase()));
  const merged = [...inStock, ...curated.filter((c) => !inStockKeys.has(c.name.toLowerCase()))];

  const basePath = `/buy-used/mobile-phones/${brand}`;
  const modelLinks = buyBrandModelLinks(brand, merged, basePath);
  const prices = merged.map((p) => priceValue(p.price)).filter((n) => n > 0);
  const priceBounds = { min: 0, max: prices.length ? Math.ceil(Math.max(...prices)) : 1000 };

  // Filters — model family + price act on every product. Colour/grade/storage
  // narrow by the listing's available specs (every listing has them, stock or
  // not): a listing matches if any of its values is selected.
  const eqLower = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const matches = (available: string[] | undefined, selected?: string[]) => {
    if (!selected?.length) return true;
    const sel = selected.filter(Boolean);
    return (available ?? []).filter(Boolean).some((v) => sel.some((s) => eqLower(s, v)));
  };

  let filtered = applyModelFilter(brand, merged, filters.model);
  if (filters.priceMin != null) filtered = filtered.filter((p) => priceValue(p.price) >= filters.priceMin!);
  if (filters.priceMax != null) filtered = filtered.filter((p) => priceValue(p.price) <= filters.priceMax!);
  filtered = filtered.filter(
    (p) => matches(p.colours, filters.colour) && matches(p.grades, filters.grade) && matches(p.storages, filters.storage),
  );

  // Keep the in-stock-first order for the default sort; explicit sorts reorder everything.
  if (params.sort !== "position") filtered = sortProducts(filtered, params.sort);

  const totalCount = filtered.length;
  const showingAll = params.limit >= 500;
  const totalPages = Math.max(1, Math.ceil(totalCount / params.limit));
  const page = Math.min(Math.max(1, params.page), totalPages);
  const start = showingAll ? 0 : (page - 1) * params.limit;
  const end = showingAll ? totalCount : start + params.limit;
  const products = filtered.slice(start, end);

  return {
    products,
    topSelling: merged.slice(0, 12),
    modelLinks,
    totalCount,
    page,
    limit: params.limit,
    totalPages,
    from: totalCount === 0 ? 0 : start + 1,
    to: Math.min(end, totalCount),
    showingAll,
    sort: params.sort,
    filters,
    priceBounds,
  };
}
