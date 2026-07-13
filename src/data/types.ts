// Shared content types. When the storefront is wired to Shopify + Supabase,
// these shapes can be produced by the data layer instead of the static modules.

export type NavLink = {
  label: string;
  href: string;
};

export type NavColumn = {
  title: string;
  href: string;
  links: NavLink[];
};

export type NavItem = {
  label: string;
  href: string;
  /** Optional mega-menu, grouped into brand/category columns. */
  columns?: NavColumn[];
  /** Optional promo tile shown alongside the mega-menu columns. */
  featured?: {
    image: string;
    href: string;
    label: string;
  };
  /** Footer links shown under the mega-menu (e.g. "Shop All"). */
  footerLinks?: NavLink[];
};

export type UspItem = {
  icon: string; // svg filename in /images, or "trustpilot" | "stars"
  title: string;
  subtitle: string;
  href: string;
  /** Render the icon inside a coloured circle badge. */
  badge?: boolean;
};

export type CategoryCard = {
  title: string;
  description?: string;
  image: string;
  href: string;
  /** Spans two columns on desktop (wide horizontal card). */
  wide?: boolean;
  /** Tailwind order class for desktop reordering. */
  orderClass?: string;
};

export type Product = {
  name: string;
  image: string;
  price: string;
  href: string;
};

export type FooterColumn = {
  title: string;
  links: NavLink[];
};

export type HeroSlide = {
  image: string;
  mobileImage?: string;
  href: string;
  alt: string;
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type BrandItem = {
  label: string;
  slug: string;
  href: string;
  image?: string;
  /** Card CTA text shown under the logo on sell brand-picker pages. */
  cardLabel?: string;
  /** Brand-specific hero image on sell brand catalog pages. */
  heroImage?: string;
};

export type ModelFilterLink = {
  label: string;
  href: string;
  count?: number;
};

export type FilterGroup = {
  title: string;
  links: NavLink[];
};

export type CatalogProduct = Product & {
  brand?: string;
  /**
   * Buy storefront only: whether we currently hold a published refurb unit for
   * this model. `false`/undefined renders a "Notify when in stock" CTA instead
   * of a buy action (mirrors the 4gadgets out-of-stock listings).
   */
  inStock?: boolean;
  /**
   * Available filter attributes for a buy listing. Every listing (in stock or
   * "coming soon") carries these so the sidebar filters narrow the whole
   * catalogue, not just live stock. In-stock units use their real inspection
   * value; other models use representative model specs.
   */
  colours?: string[];
  grades?: string[];
  storages?: string[];
};

export type SellProductDetail = CatalogProduct & {
  shopifyProductId?: string;
  shopifyVariantId?: string;
  brandSlug?: string;
  categorySlug?: string;
  priceWorking?: number;
  priceFaulty?: number;
  priceNoPower?: number;
  familyLabel?: string;
  familyHref?: string;
};

export type SellCategoryConfig = {
  slug: string;
  title: string;
  heading: string;
  heroImage: string;
  layout: "brand-picker" | "catalog";
  filters?: FilterGroup[];
  brands?: BrandItem[];
  products: CatalogProduct[];
  description: string[];
};

export type BuyCollectionConfig = {
  slug: string[];
  title: string;
  heading: string;
  heroImage: string;
  filters?: FilterGroup[];
  products: CatalogProduct[];
  description: string[];
};

export type StoreMode = "buy" | "sell";
