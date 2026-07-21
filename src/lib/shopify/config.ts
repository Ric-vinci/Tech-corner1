/** Shopify + CDN env helpers. */

export const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "";
export const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? "";
export const SHOPIFY_ADMIN_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ?? "";
export const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-01";
export const IMAGE_CDN_BASE_URL = (process.env.IMAGE_CDN_BASE_URL ?? "").replace(/\/$/, "");
const IMAGE_FALLBACK_ORIGIN = (process.env.IMAGE_FALLBACK_ORIGIN ?? "https://www.4gadgets.co.uk").replace(/\/$/, "");

/** Set to true when the CDN/S3 bucket allows public reads (or via CloudFront). */
export function isImageCdnPublic(): boolean {
  if (process.env.IMAGE_CDN_PUBLIC === "true") return true;
  if (process.env.IMAGE_CDN_PUBLIC === "false") return false;
  // Direct S3 URLs are private by default in this project.
  return Boolean(IMAGE_CDN_BASE_URL && !IMAGE_CDN_BASE_URL.includes(".s3."));
}

export function isShopifyStorefrontConfigured(): boolean {
  return Boolean(SHOPIFY_STORE_DOMAIN && SHOPIFY_STOREFRONT_ACCESS_TOKEN);
}

export function isShopifyAdminConfigured(): boolean {
  return Boolean(SHOPIFY_STORE_DOMAIN && SHOPIFY_ADMIN_ACCESS_TOKEN);
}

export function isShopifyConfigured(): boolean {
  return isShopifyStorefrontConfigured() || isShopifyAdminConfigured();
}

/** Prefer Storefront API for catalog reads when token is set (falls back to Admin if unpublished). */
export function preferStorefrontCatalogReads(): boolean {
  if (process.env.SHOPIFY_PREFER_ADMIN_READS === "true") return false;
  return isShopifyStorefrontConfigured();
}

/** Map local JSON paths to S3 keys. */
export function normalizeImagePath(image: string): string {
  if (image.startsWith("/images/sell/")) {
    return image.replace("/images/sell/", "/upload/sell/");
  }
  if (image.startsWith("/images/brands/")) {
    return image.replace("/images/brands/", "/upload/heroes/");
  }
  if (image.startsWith("/images/")) {
    return image.replace("/images/", "/upload/heroes/");
  }
  return image;
}

/**
 * Whether the static JSON catalogue in src/data may be used.
 *
 * An explicit SHOPIFY_USE_STATIC_FALLBACK wins in both directions. The
 * production heuristic below only applies when it is unset: it assumes Shopify
 * holds the catalogue, which stopped being true once the sell catalogue moved
 * into the repo and Shopify kept only the refurb units. Without the explicit
 * check the storefront went blank in production while working in dev.
 */
export function allowStaticCatalogFallback(): boolean {
  if (process.env.SHOPIFY_USE_STATIC_FALLBACK === "false") return false;
  if (process.env.SHOPIFY_USE_STATIC_FALLBACK === "true") return true;
  if (process.env.NODE_ENV === "production" && isShopifyConfigured()) return false;
  return !isShopifyConfigured();
}

function resolveImageFallbackUrl(original: string, normalized: string): string {
  const sellPath = normalized.match(/^\/upload\/sell\/(.+)$/) ?? original.match(/^\/images\/sell\/(.+)$/);
  if (sellPath) {
    const file = sellPath[1].split("/").pop() ?? "";
    const first = file.charAt(0).toLowerCase();
    const second = (file.charAt(1) ?? "0").toLowerCase();
    return `${IMAGE_FALLBACK_ORIGIN}/media/catalog/product/${first}/${second}/${file}`;
  }

  const heroPath = normalized.match(/^\/upload\/heroes\/(.+)$/) ?? original.match(/^\/images\/brands\/(.+)$/);
  if (heroPath) {
    return `${IMAGE_FALLBACK_ORIGIN}/media/catalog/category/${heroPath[1]}`;
  }

  const imagePath = original.match(/^\/images\/(.+)$/);
  if (imagePath) {
    return `${IMAGE_FALLBACK_ORIGIN}/media/catalog/category/${imagePath[1]}`;
  }

  return original;
}

/** Turn a stored path or URL into a full image URL for display. */
export function resolveImageUrl(image: string): string {
  if (!image) return image;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    if (!isImageCdnPublic() && IMAGE_CDN_BASE_URL && image.startsWith(`${IMAGE_CDN_BASE_URL}/`)) {
      const path = image.slice(IMAGE_CDN_BASE_URL.length);
      return resolveImageFallbackUrl(image, path);
    }
    return image;
  }

  const path = normalizeImagePath(image);

  if (IMAGE_CDN_BASE_URL && path.startsWith("/") && isImageCdnPublic()) {
    return `${IMAGE_CDN_BASE_URL}${path}`;
  }

  if (path.startsWith("/upload/") || image.startsWith("/images/")) {
    return resolveImageFallbackUrl(image, path);
  }

  return image;
}
