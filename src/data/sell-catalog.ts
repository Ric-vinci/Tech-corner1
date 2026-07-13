import type { BrandItem, BreadcrumbItem, CatalogProduct, FilterGroup, ModelFilterLink, SellCategoryConfig, SellProductDetail } from "./types";
import { sellTradeIns } from "./content";
import samsungMobileData from "./generated/samsung-mobile.json";
import { fetchBrandSellDetailsFromShopify, fetchSellProductFromShopify } from "@/lib/shopify/catalog";
import { fetchBrandMetaFromShopify, fetchSellCategoryFromShopify } from "@/lib/shopify/collections";
import { fetchBrandSellPageFromShopify } from "@/lib/shopify/catalog";
import { allowStaticCatalogFallback, isShopifyConfigured, resolveImageUrl } from "@/lib/shopify/config";
import { MOBILE_BRANDS, getMobileBrandMeta } from "./mobile-brands";
import type { SellCatalogParams } from "@/lib/sell/catalog-params";
import { findModelFamily, productMatchesFamily, resolveProductFamilyLink } from "@/lib/sell/model-family";

export { isShopifyConfigured };

const mobileBrands: BrandItem[] = MOBILE_BRANDS;

const tabletFilters: FilterGroup[] = [
  {
    title: "Model",
    links: [
      { label: "Apple", href: "/sell-my/tablets?brand=apple" },
      { label: "Google", href: "/sell-my/tablets?brand=google" },
      { label: "Huawei", href: "/sell-my/tablets?brand=huawei" },
      { label: "Lenovo", href: "/sell-my/tablets?brand=lenovo" },
      { label: "Samsung", href: "/sell-my/tablets?brand=samsung" },
      { label: "Sony", href: "/sell-my/tablets?brand=sony" },
    ],
  },
];

const consoleFilters: FilterGroup[] = [
  {
    title: "Model",
    links: [
      { label: "Microsoft", href: "/sell-my/games-consoles?brand=microsoft" },
      { label: "Nintendo", href: "/sell-my/games-consoles?brand=nintendo" },
      { label: "Sega", href: "/sell-my/games-consoles?brand=sega" },
      { label: "Sony", href: "/sell-my/games-consoles?brand=sony" },
    ],
  },
];

const watchFilters: FilterGroup[] = [
  {
    title: "Model",
    links: [
      { label: "Apple", href: "/sell-my/sell-my-watch?brand=apple" },
      { label: "Garmin", href: "/sell-my/sell-my-watch?brand=garmin" },
      { label: "Oppo", href: "/sell-my/sell-my-watch?brand=oppo" },
      { label: "Samsung", href: "/sell-my/sell-my-watch?brand=samsung" },
    ],
  },
];

const cameraFilters: FilterGroup[] = [
  {
    title: "Model",
    links: [{ label: "GoPro", href: "/sell-my/sell-my-camera?brand=gopro" }],
  },
];

const appleMobileProducts = sellTradeIns.filter((p) => p.name.startsWith("Apple"));
const samsungMobileProducts: SellProductDetail[] = (samsungMobileData.products as CatalogProduct[]).map((p) => {
  const priceMatch = p.price.match(/£([\d.]+)/);
  const priceWorking = priceMatch ? parseFloat(priceMatch[1]) : 20;
  const familyName = p.name.replace(/\s+\d+(\.\d+)?(GB|TB)$/i, "");
  const familySlug = familyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return {
    ...p,
    image: resolveImageUrl(p.image),
    brand: "Samsung",
    brandSlug: "samsung",
    categorySlug: "mobile",
    priceWorking,
    priceFaulty: Math.max(5, Math.round(priceWorking * 0.25)),
    priceNoPower: 0,
    familyLabel: `Trade In Your ${familyName}`,
    familyHref: `/sell-my/mobile/samsung/trade-in-your-${familySlug.replace(/^samsung-/, "samsung-")}`,
  };
});
const samsungModelLinks = samsungMobileData.modelLinks as ModelFilterLink[];

const sellBrandCatalogMeta: Record<string, Record<string, { totalProducts: number }>> = {
  mobile: {
    samsung: { totalProducts: 250 },
  },
};

export const sellCategories: Record<string, SellCategoryConfig> = {
  mobile: {
    slug: "mobile",
    title: "Trade in Your Mobile Phones",
    heading: "Trade in Your Mobile Phones",
    heroImage: "/images/category-brands-phones.jpeg",
    layout: "brand-picker",
    brands: mobileBrands,
    products: [],
    description: [
      "Looking to sell your old mobile phone? 4gadgets offers competitive trade-in prices for phones in any condition — working, damaged, or faulty.",
      "Simply select your phone brand below, find your model, and get an instant quote. We provide free postage and fast payment once we receive your device.",
      "Trading in your old phone helps reduce e-waste and puts cash in your pocket. Start your trade-in today.",
    ],
  },
  tablets: {
    slug: "tablets",
    title: "Sell my Tablet",
    heading: "Trade-In Your Old Tablets",
    heroImage: "/images/MicrosoftTeams-image_6_.png",
    layout: "catalog",
    filters: tabletFilters,
    products: [
      {
        name: "Apple iPad 6 9.7 (2018)",
        image: "/images/MicrosoftTeams-image_6_.png",
        price: "Get up to £45.00",
        href: "/sell-my/apple-ipad-6-9-7-2018.html",
        brand: "Apple",
      },
      {
        name: "Samsung Galaxy Tab S6 Lite (2020)",
        image: "/images/tumbnail_5dd4e81d-9db6-4220-8f82-541b674b0c23.jpg",
        price: "Get up to £35.00",
        href: "/sell-my/samsung-galaxy-tab-s6-lite-2020.html",
        brand: "Samsung",
      },
    ],
    description: [
      "Trade in your old tablet for fast payment with 4gadgets. We accept tablets in any condition and offer free postage on all trade-ins.",
      "Whether you have an iPad, Samsung Galaxy Tab, or any other tablet, get an instant quote and send your device to us for free.",
    ],
  },
  "games-consoles": {
    slug: "games-consoles",
    title: "Sell my Games Console",
    heading: "Trade-In Your Games Console",
    heroImage: "/images/Refurbished_Consoles_-_ps5.png",
    layout: "catalog",
    filters: consoleFilters,
    products: [
      {
        name: "Sony PlayStation 5",
        image: "/images/Refurbished_Consoles_-_ps5.png",
        price: "Get up to £180.00",
        href: "/sell-my/sony-playstation-5.html",
        brand: "Sony",
      },
      {
        name: "Microsoft Xbox Series X",
        image: "/images/Refurbished_Consoles_-_ps5.png",
        price: "Get up to £160.00",
        href: "/sell-my/microsoft-xbox-series-x.html",
        brand: "Microsoft",
      },
    ],
    description: [
      "Sell your old games console to 4gadgets for a great price. We buy PlayStation, Xbox, Nintendo, and Sega consoles in any condition.",
      "Get a freepost pack, send us your console, and receive payment within 2 days of us receiving your device.",
    ],
  },
  "sell-my-watch": {
    slug: "sell-my-watch",
    title: "Sell my Smartwatch",
    heading: "Trade-In Your Used Smart Watch",
    heroImage: "/images/MicrosoftTeams-image_7_.png",
    layout: "catalog",
    filters: watchFilters,
    products: [
      {
        name: "Apple Watch Series 9 45mm",
        image: "/images/MicrosoftTeams-image_7_.png",
        price: "Get up to £120.00",
        href: "/sell-my/apple-watch-series-9-45mm.html",
        brand: "Apple",
      },
      {
        name: "Samsung Galaxy Watch 6 40mm",
        image: "/images/MicrosoftTeams-image_7_.png",
        price: "Get up to £80.00",
        href: "/sell-my/samsung-galaxy-watch-6-40mm.html",
        brand: "Samsung",
      },
    ],
    description: [
      "Trade in your smartwatch for instant cash with 4gadgets. We accept Apple Watch, Samsung Galaxy Watch, Garmin, and more.",
      "All smartwatches are accepted in any condition. Free postage and fast payment guaranteed.",
    ],
  },
  "sell-my-camera": {
    slug: "sell-my-camera",
    title: "Sell my Camera",
    heading: "Trade-In Your Used Camera",
    heroImage: "/images/Go_pro.png",
    layout: "catalog",
    filters: cameraFilters,
    products: [
      {
        name: "GoPro Hero 11 Black",
        image: "/images/Go_pro.png",
        price: "Get up to £90.00",
        href: "/sell-my/gopro-hero-11-black.html",
        brand: "GoPro",
      },
    ],
    description: [
      "Sell your used camera or action cam to 4gadgets. We currently buy GoPro cameras in any condition.",
      "Get an instant quote, free postage, and fast payment when you trade in your camera with us.",
    ],
  },
};

export const sellBrandProducts: Record<string, Record<string, typeof sellTradeIns>> = {
  mobile: {
    apple: appleMobileProducts.length
      ? appleMobileProducts
      : [
          {
            name: "Apple iPhone 11 64GB",
            image: "/images/iPhone_11_1.jpg",
            price: "Get up to £60.00",
            href: "/sell-my/apple-iphone-11-64gb.html",
          },
        ],
    samsung: samsungMobileProducts.length
      ? samsungMobileProducts
      : [
          {
            name: "Samsung Galaxy S21 5G 128GB",
            image: "/images/s21_5g.jpg",
            price: "Get up to £50.00",
            href: "/sell-my/samsung-galaxy-s21-5g-g991b-128gb.html",
          },
        ],
    google: [
      {
        name: "Google Pixel 8 128GB",
        image: "/images/tumbnail_c35c2b1d-0976-4e91-b4d1-0f40682e4388.jpg",
        price: "Get up to £70.00",
        href: "/sell-my/google-pixel-8-128gb.html",
      },
    ],
    huawei: [
      {
        name: "Huawei P30 Pro",
        image: "/images/MicrosoftTeams-image_5_.png",
        price: "Get up to £25.00",
        href: "/sell-my/huawei-p30-pro.html",
      },
    ],
  },
};

export function getSellCategory(slug: string): SellCategoryConfig | undefined {
  return sellCategories[slug];
}

export async function getSellCategoryAsync(slug: string): Promise<SellCategoryConfig | undefined> {
  const fromShopify = await fetchSellCategoryFromShopify(slug);
  const staticCategory = getSellCategory(slug);

  if (fromShopify) {
    if (!fromShopify.description.length && staticCategory?.description) {
      fromShopify.description = staticCategory.description;
    }
    if (fromShopify.layout === "catalog" && !fromShopify.products.length && staticCategory?.products.length && allowStaticCatalogFallback()) {
      fromShopify.products = staticCategory.products;
      fromShopify.filters = staticCategory.filters;
    }
    fromShopify.heroImage = resolveImageUrl(fromShopify.heroImage);
    if (fromShopify.brands) {
      fromShopify.brands = fromShopify.brands.map((brand) => ({
        ...brand,
        image: brand.image ? resolveImageUrl(brand.image) : brand.image,
        heroImage: brand.heroImage ? resolveImageUrl(brand.heroImage) : brand.heroImage,
      }));
    }
    return fromShopify;
  }

  if (!allowStaticCatalogFallback()) return undefined;
  if (!staticCategory) return undefined;
  return {
    ...staticCategory,
    heroImage: resolveImageUrl(staticCategory.heroImage),
    brands: staticCategory.brands?.map((brand) => ({
      ...brand,
      image: brand.image ? resolveImageUrl(brand.image) : brand.image,
      heroImage: brand.heroImage ? resolveImageUrl(brand.heroImage) : brand.heroImage,
    })),
  };
}

export function getSellBrandProducts(category: string, brand: string): CatalogProduct[] {
  if (category === "mobile" && brand === "samsung") {
    return samsungMobileProducts;
  }

  const specific = sellBrandProducts[category]?.[brand];
  if (specific?.length) return specific;

  const label = getSellBrandLabel(brand);
  return [
    {
      name: `${label} Device (select model)`,
      image: "/images/MicrosoftTeams-image_5_.png",
      price: "Get a quote",
      href: `/sell-my/${brand}-device.html`,
    },
  ];
}

export type SellBrandCatalogPage = {
  products: CatalogProduct[];
  modelLinks: ModelFilterLink[];
  pageTitle?: string;
  heroImage?: string;
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  from: number;
  to: number;
  showingAll: boolean;
  sort: SellCatalogParams["sort"];
};

function resolveSamsungModelLinks(pageModelLinks: ModelFilterLink[], showingAll: boolean): ModelFilterLink[] {
  if (showingAll) return samsungModelLinks;
  return pageModelLinks.length ? pageModelLinks : samsungModelLinks.slice(0, 20);
}

function paginateStaticProducts(
  products: CatalogProduct[],
  { limit, page, sort }: SellCatalogParams,
): Omit<SellBrandCatalogPage, "modelLinks" | "pageTitle" | "heroImage" | "sort"> & { products: CatalogProduct[] } {
  let sorted = [...products];
  if (sort === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "low_to_high" || sort === "high_to_low") {
    sorted.sort((a, b) => {
      const pa = parseFloat(a.price.match(/£([\d.]+)/)?.[1] ?? "0");
      const pb = parseFloat(b.price.match(/£([\d.]+)/)?.[1] ?? "0");
      return sort === "low_to_high" ? pa - pb : pb - pa;
    });
  }

  const totalCount = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const pageProducts = sorted.slice(start, start + limit);
  const from = totalCount === 0 ? 0 : start + 1;
  const to = Math.min(start + limit, totalCount);
  const showingAll = limit >= totalCount;

  return { products: pageProducts, totalCount, page: safePage, limit, totalPages, from, to, showingAll };
}

export type SellBrandFamilyPage = {
  familyLabel: string;
  familyHref: string;
  products: CatalogProduct[];
  modelLinks: ModelFilterLink[];
  totalCount: number;
};

export function getSellBrandFamilyPage(
  category: string,
  brand: string,
  familySlug: string,
): SellBrandFamilyPage | null {
  const modelLinks = category === "mobile" && brand === "samsung" ? samsungModelLinks : [];
  const family = findModelFamily(modelLinks, familySlug);
  if (!family) return null;

  const products = getSellBrandProducts(category, brand).filter((product) =>
    productMatchesFamily(product as SellProductDetail, familySlug),
  );

  if (!products.length) return null;

  return {
    familyLabel: family.label,
    familyHref: family.href,
    products,
    modelLinks,
    totalCount: products.length,
  };
}

export async function getSellBrandFamilyPageAsync(
  category: string,
  brand: string,
  familySlug: string,
): Promise<SellBrandFamilyPage | null> {
  const modelLinks = getSellBrandSidebarLinks(category, brand);
  const family = findModelFamily(modelLinks, familySlug);
  if (!family) return null;

  const fromShopify = await fetchBrandSellDetailsFromShopify(category, brand);
  if (fromShopify?.products.length) {
    const products = fromShopify.products.filter((product) => productMatchesFamily(product, familySlug));
    if (!products.length) return null;

    return {
      familyLabel: family.label,
      familyHref: family.href,
      products,
      modelLinks,
      totalCount: products.length,
    };
  }

  if (!allowStaticCatalogFallback()) return null;
  return getSellBrandFamilyPage(category, brand, familySlug);
}

export function getSellBrandSidebarLinks(category: string, brand: string): ModelFilterLink[] {
  if (category === "mobile" && brand === "samsung") {
    return samsungModelLinks;
  }
  return [];
}

export async function getSellBrandCatalogPageAsync(
  category: string,
  brand: string,
  catalogParams: SellCatalogParams,
): Promise<SellBrandCatalogPage> {
  const [brandMeta, fromShopify] = await Promise.all([
    fetchBrandMetaFromShopify(category, brand),
    fetchBrandSellPageFromShopify(category, brand, catalogParams),
  ]);

  // Static seed for this brand (empty when fallback is off).
  const staticProducts = allowStaticCatalogFallback() ? getSellBrandProducts(category, brand) : [];

  // Use Shopify when it actually returned products. If the Shopify collection
  // exists but is empty (e.g. the catalogue was cleared) and we have static seed
  // data, fall through to the static list rather than showing an empty page.
  if (fromShopify && (fromShopify.products.length > 0 || staticProducts.length === 0)) {
    const modelLinks =
      category === "mobile" && brand === "samsung"
        ? resolveSamsungModelLinks(fromShopify.modelLinks, fromShopify.showingAll)
        : fromShopify.modelLinks;

    return {
      products: fromShopify.products,
      modelLinks,
      pageTitle: brandMeta?.pageTitle,
      heroImage: brandMeta?.heroImage,
      totalCount: fromShopify.totalCount,
      page: fromShopify.page,
      limit: fromShopify.limit,
      totalPages: fromShopify.totalPages,
      from: fromShopify.from,
      to: fromShopify.to,
      showingAll: fromShopify.showingAll,
      sort: catalogParams.sort,
    };
  }

  if (!allowStaticCatalogFallback()) {
    return {
      products: [],
      modelLinks: [],
      pageTitle: brandMeta?.pageTitle ?? getSellBrandPageTitle(brand),
      heroImage: brandMeta?.heroImage ?? getSellBrandHeroImage(category, brand),
      totalCount: 0,
      page: catalogParams.page,
      limit: catalogParams.limit,
      totalPages: 1,
      from: 0,
      to: 0,
      showingAll: false,
      sort: catalogParams.sort,
    };
  }

  const allProducts = getSellBrandProducts(category, brand);
  const paged = paginateStaticProducts(allProducts, catalogParams);
  const modelLinks =
    category === "mobile" && brand === "samsung"
      ? resolveSamsungModelLinks(getSellBrandModelLinks(category, brand, paged.products), paged.showingAll)
      : getSellBrandModelLinks(category, brand, paged.products);

  return {
    ...paged,
    modelLinks,
    pageTitle: getSellBrandPageTitle(brand),
    heroImage: getSellBrandHeroImage(category, brand),
    sort: catalogParams.sort,
  };
}

export async function getSellBrandCatalogAsync(
  category: string,
  brand: string,
): Promise<{ products: CatalogProduct[]; modelLinks: ModelFilterLink[]; pageTitle?: string; heroImage?: string }> {
  const fromShopify = await fetchBrandSellDetailsFromShopify(category, brand);
  const brandMeta = await fetchBrandMetaFromShopify(category, brand);

  if (fromShopify?.products.length) {
    const modelLinks =
      category === "mobile" && brand === "samsung"
        ? samsungModelLinks
        : getSellBrandModelLinks(category, brand, fromShopify.products);

    return {
      products: fromShopify.products,
      modelLinks,
      pageTitle: brandMeta?.pageTitle,
      heroImage: brandMeta?.heroImage,
    };
  }

  if (!allowStaticCatalogFallback()) {
    return {
      products: [],
      modelLinks: [],
      pageTitle: brandMeta?.pageTitle ?? getSellBrandPageTitle(brand),
      heroImage: brandMeta?.heroImage ?? getSellBrandHeroImage(category, brand),
    };
  }

  const products = getSellBrandProducts(category, brand);
  return {
    products,
    modelLinks: getSellBrandModelLinks(category, brand, products),
    pageTitle: getSellBrandPageTitle(brand),
    heroImage: getSellBrandHeroImage(category, brand),
  };
}

export async function getSellBrandProductsAsync(category: string, brand: string): Promise<CatalogProduct[]> {
  const catalog = await getSellBrandCatalogAsync(category, brand);
  return catalog.products;
}

export function getSellBrandModelLinks(category: string, brand: string, products: CatalogProduct[]): ModelFilterLink[] {
  if (category === "mobile" && brand === "samsung") {
    return samsungModelLinks;
  }

  return products.map((product) => ({
    label: `Trade In Your ${product.name}`,
    href: product.href,
  }));
}

export async function getSellBrandModelLinksAsync(
  category: string,
  brand: string,
  products: CatalogProduct[],
): Promise<ModelFilterLink[]> {
  return getSellBrandModelLinks(category, brand, products);
}

export function getSellBrandPageTitle(brand: string): string {
  const item = mobileBrands.find((b) => b.slug === brand);
  if (item?.cardLabel) return item.cardLabel;
  return `Trade In Your ${getSellBrandLabel(brand)} Mobile Phone`;
}

export function getSellBrandHeroImage(category: string, brand: string): string | undefined {
  const item = mobileBrands.find((b) => b.slug === brand);
  if (item?.heroImage) return resolveImageUrl(item.heroImage);
  const categoryHero = getSellCategory(category)?.heroImage;
  return categoryHero ? resolveImageUrl(categoryHero) : undefined;
}

export function getSellBrandDefaultPerPage(category: string, brand: string): number {
  if (category === "mobile" && brand === "samsung") {
    return 16;
  }
  return 16;
}

export function getSellBrandTotalProducts(category: string, brand: string, visibleCount: number): number {
  if (category === "mobile" && brand === "samsung" && samsungMobileData.totalProducts) {
    return samsungMobileData.totalProducts;
  }
  return sellBrandCatalogMeta[category]?.[brand]?.totalProducts ?? visibleCount;
}

export function getSellBrandLabel(slug: string): string {
  const brand = mobileBrands.find((b) => b.slug === slug);
  return brand?.label ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

export async function getSellProductAsync(slug: string): Promise<SellProductDetail | undefined> {
  const fromShopify = await fetchSellProductFromShopify(slug);
  if (fromShopify) return fromShopify;
  return getSellProduct(slug);
}

export function getSellProduct(slug: string): SellProductDetail | undefined {
  const normalized = slug.endsWith(".html") ? slug : `${slug}.html`;
  const allProducts: SellProductDetail[] = [
    ...sellTradeIns.map((p) => ({
      ...p,
      priceWorking: parseFloat(p.price.match(/£([\d.]+)/)?.[1] ?? "0") || undefined,
      priceFaulty: 5,
      priceNoPower: 0,
    })),
    ...Object.values(sellCategories).flatMap((c) => c.products),
    ...Object.values(sellBrandProducts).flatMap((brands) => Object.values(brands).flat()),
    ...samsungMobileProducts,
  ];
  return allProducts.find((p) => p.href === `/sell-my/${normalized}` || p.href.endsWith(`/${normalized}`));
}

export function getSellProductBreadcrumbs(product: SellProductDetail): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ label: "Home", href: "/sell-my" }];

  if (product.categorySlug === "mobile") {
    items.push({ label: "Trade in Your Mobile Phones", href: "/sell-my/mobile" });
  }

  if (product.brandSlug) {
    const brand = mobileBrands.find((b) => b.slug === product.brandSlug);
    items.push({
      label: brand?.cardLabel ?? `Trade In Your ${product.brand ?? product.brandSlug} Mobile Phone`,
      href: `/sell-my/mobile/${product.brandSlug}`,
    });
  }

  const familyLink =
    product.categorySlug === "mobile" && product.brandSlug === "samsung"
      ? resolveProductFamilyLink(product, samsungModelLinks)
      : product.familyLabel && product.familyHref
        ? { label: product.familyLabel, href: product.familyHref }
        : undefined;

  if (familyLink) {
    items.push({ label: familyLink.label, href: familyLink.href });
  }

  items.push({ label: product.name });
  return items;
}
