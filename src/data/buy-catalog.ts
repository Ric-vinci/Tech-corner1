import type { BuyCollectionConfig, CatalogProduct, FilterGroup } from "./types";
import { buyTopCategories, buyTrending } from "./content";
import { megaNav } from "./navigation";
import { fetchBuyCollectionFromShopify } from "@/lib/shopify/collections";
import { fetchBuyProductFromShopify } from "@/lib/shopify/catalog";
import { allowStaticCatalogFallback } from "@/lib/shopify/config";

function productsFromNavColumn(hrefPrefix: string, brandLinks: { label: string; href: string }[]): CatalogProduct[] {
  return brandLinks
    .filter((l) => !l.label.startsWith("Shop All"))
    .slice(0, 12)
    .map((link) => ({
      name: link.label,
      image: "/images/MicrosoftTeams-image_5_.png",
      price: "£—",
      href: link.href,
      brand: hrefPrefix.split("/").pop(),
    }));
}

const mobilePhonesNav = megaNav.find((n) => n.label === "Mobile Phones");
const tabletsNav = megaNav.find((n) => n.label === "Tablets");
const watchesNav = megaNav.find((n) => n.label === "Smart Watches");

const mobileFilters: FilterGroup[] =
  mobilePhonesNav?.columns?.map((col) => ({
    title: col.title,
    links: [{ label: `Shop All ${col.title}`, href: col.href }, ...col.links.slice(0, 8)],
  })) ?? [];

const tabletFilters: FilterGroup[] =
  tabletsNav?.columns?.map((col) => ({
    title: col.title,
    links: [{ label: `Shop All ${col.title}`, href: col.href }, ...col.links.slice(0, 8)],
  })) ?? [];

const watchFilters: FilterGroup[] =
  watchesNav?.columns?.map((col) => ({
    title: col.title,
    links: [{ label: `Shop All ${col.title}`, href: col.href }, ...col.links.slice(0, 8)],
  })) ?? [];

export const buyCollections: Record<string, BuyCollectionConfig> = {
  "mobile-phones": {
    slug: ["mobile-phones"],
    title: "Refurbished Mobile Phones",
    heading: "Refurbished Mobile Phones",
    heroImage: "/images/MicrosoftTeams-image_5_.png",
    filters: mobileFilters,
    products: [
      ...buyTrending.filter((p) => p.name.includes("Galaxy") || p.name.includes("iPhone") || p.name.includes("Pixel")),
      ...(mobilePhonesNav?.columns?.flatMap((col) => productsFromNavColumn(col.href, col.links)) ?? []),
    ].slice(0, 24),
    description: [
      "Shop our range of quality refurbished mobile phones at unbeatable prices. All devices come with a 12-month warranty and free next-day delivery.",
      "Choose from Apple iPhone, Samsung Galaxy, Google Pixel, and more — all thoroughly tested and graded for quality.",
    ],
  },
  tablets: {
    slug: ["tablets"],
    title: "Refurbished Tablets",
    heading: "Refurbished Tablets",
    heroImage: "/images/MicrosoftTeams-image_6_.png",
    filters: tabletFilters,
    products: buyTrending.filter((p) => p.name.includes("Tab")).concat(
      tabletsNav?.columns?.flatMap((col) => productsFromNavColumn(col.href, col.links)) ?? [],
    ).slice(0, 24),
    description: [
      "Browse our selection of refurbished tablets from Apple, Samsung, and more. Great prices with a 12-month warranty on all orders.",
    ],
  },
  "game-consoles": {
    slug: ["game-consoles"],
    title: "Refurbished Games Consoles",
    heading: "Refurbished Games Consoles",
    heroImage: "/images/Refurbished_Consoles_-_ps5.png",
    filters: [],
    products: [
      {
        name: "Sony PlayStation 5",
        image: "/images/Refurbished_Consoles_-_ps5.png",
        price: "£349.99",
        href: "/buy-used/sony-playstation-5.html",
      },
    ],
    description: [
      "Shop refurbished games consoles including PlayStation, Xbox, and Nintendo. All consoles tested and warrantied.",
    ],
  },
  deals: {
    slug: ["deals"],
    title: "Refurbished Deals",
    heading: "Big Deals",
    heroImage: "/images/MicrosoftTeams-image_8_.png",
    filters: [],
    products: buyTrending,
    description: ["Our best refurbished tech deals — limited time offers on top devices."],
  },
  "smart-watches": {
    slug: ["smart-watches"],
    title: "Refurbished Smartwatches",
    heading: "Refurbished Smart Watches",
    heroImage: "/images/MicrosoftTeams-image_7_.png",
    filters: watchFilters,
    products: watchesNav?.columns?.flatMap((col) => productsFromNavColumn(col.href, col.links)) ?? [],
    description: ["Quality refurbished smartwatches from Apple and Samsung at great prices."],
  },
  accessories: {
    slug: ["accessories"],
    title: "Refurbished Accessories",
    heading: "Refurbished Accessories",
    heroImage: "/images/MicrosoftTeams-image_9_.png",
    filters: [],
    products: [],
    description: ["Phone cases, chargers, and accessories for your refurbished devices."],
  },
  "all-refurbished": {
    slug: ["all-refurbished"],
    title: "All Refurbished",
    heading: "All Refurbished Tech",
    heroImage: "/images/Homepage_Banner_-_DSKTP_-_Rely_on_refurb_1.png",
    filters: [],
    products: buyTrending,
    description: ["Browse our full range of refurbished phones, tablets, consoles, and more."],
  },
};

/** Resolve a buy-used path to a collection or product. */
export async function resolveBuyPathAsync(slug: string[]): Promise<{
  type: "collection" | "product" | "subcollection";
  collection?: BuyCollectionConfig;
  product?: CatalogProduct;
  subcollectionTitle?: string;
}> {
  if (slug.length === 0) return { type: "collection" };

  const last = slug[slug.length - 1];
  if (last.endsWith(".html")) {
    const fromShopify = await fetchBuyProductFromShopify(last);
    if (fromShopify) return { type: "product", product: fromShopify };

    const staticResolved = resolveBuyPath(slug);
    if (staticResolved.product && allowStaticCatalogFallback()) return staticResolved;
    if (staticResolved.product) return staticResolved;

    return {
      type: "product",
      product: {
        name: last.replace(".html", "").replace(/-/g, " "),
        image: "/images/MicrosoftTeams-image_5_.png",
        price: "£—",
        href: `/buy-used/${slug.join("/")}`,
      },
    };
  }

  const fromShopify = await fetchBuyCollectionFromShopify(slug);
  if (fromShopify) {
    return slug.length === 2
      ? { type: "subcollection", collection: fromShopify, subcollectionTitle: slug[1] }
      : { type: "collection", collection: fromShopify };
  }

  if (!allowStaticCatalogFallback()) return { type: "collection" };
  return resolveBuyPath(slug);
}

/** Resolve a buy-used path to a collection or product (static fallback). */
export function resolveBuyPath(slug: string[]): {
  type: "collection" | "product" | "subcollection";
  collection?: BuyCollectionConfig;
  product?: CatalogProduct;
  subcollectionTitle?: string;
} {
  if (slug.length === 0) return { type: "collection" };

  const last = slug[slug.length - 1];
  if (last.endsWith(".html")) {
    const href = `/buy-used/${slug.join("/")}`;
    const product =
      buyTrending.find((p) => p.href === href) ??
      Object.values(buyCollections)
        .flatMap((c) => c.products)
        .find((p) => p.href === href);
    if (product) return { type: "product", product };
    return {
      type: "product",
      product: {
        name: last.replace(".html", "").replace(/-/g, " "),
        image: "/images/MicrosoftTeams-image_5_.png",
        price: "£—",
        href,
      },
    };
  }

  if (slug.length === 1) {
    const collection = buyCollections[slug[0]];
    if (collection) return { type: "collection", collection };
  }

  if (slug.length === 2) {
    const parent = buyCollections[slug[0]];
    if (parent) {
      const brandHref = `/buy-used/${slug.join("/")}`;
      const brandProducts = parent.products.filter((p) => p.href.includes(brandHref) || p.brand === slug[1]);
      return {
        type: "subcollection",
        collection: {
          ...parent,
          slug,
          title: `${slug[1].charAt(0).toUpperCase() + slug[1].slice(1)} — ${parent.title}`,
          heading: `${slug[1].charAt(0).toUpperCase() + slug[1].slice(1)} ${parent.title.replace("Refurbished ", "")}`,
          products: brandProducts.length ? brandProducts : parent.products.slice(0, 12),
        },
        subcollectionTitle: slug[1],
      };
    }
  }

  const collection = buyCollections[slug[0]];
  if (collection) return { type: "collection", collection };

  return { type: "collection" };
}

export function getBuyHomeCategories() {
  return buyTopCategories;
}
