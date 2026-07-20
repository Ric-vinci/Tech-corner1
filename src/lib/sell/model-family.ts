import type { ModelFilterLink, SellProductDetail } from "@/data/types";

export function normalizeFamilySlug(slug: string): string {
  return slug.replace(/^trade-in-your-/, "").toLowerCase();
}

export function familySlugFromHref(href: string): string {
  return href.split("/").pop() ?? "";
}

const BRAND_PREFIX = /^(apple|samsung|google|huawei|oneplus|sony|nokia|motorola|xiaomi|oppo|realme|honor|nothing|lg|htc|zte|blackberry|redmi)[\s-]+/i;

/** Product's model slug, brand-agnostic: "Apple iPhone 8 256GB" → "iphone-8". */
function productModelSlug(name: string): string {
  return name
    .replace(/\s*-\s*[A-Za-z0-9()/.\- ]+?\s+\d+\s*(GB|TB)\s*$/i, "") // "- A226B 64GB"
    .replace(/\s+\d+(\.\d+)?\s*(GB|TB)\s*$/i, "") // "256GB"
    .replace(BRAND_PREFIX, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function productMatchesFamily(product: SellProductDetail, familySlug: string): boolean {
  const target = normalizeFamilySlug(familySlug);

  if (product.familyHref) {
    const productFamily = normalizeFamilySlug(familySlugFromHref(product.familyHref));
    if (productFamily === target) return true;
  }

  // Brand-agnostic model match — the sidebar links use short slugs like "iphone-8"
  // / "galaxy-note-20-ultra" (no brand prefix), which the family-href form doesn't.
  const modelSlug = productModelSlug(product.name);
  if (modelSlug && (modelSlug === target || modelSlug === target.replace(BRAND_PREFIX, ""))) return true;

  const handle = product.href.replace("/sell-my/", "").replace(/\.html$/, "");
  const handleBase = handle.replace(/-\d+(\.\d+)?(gb|tb)$/i, "");
  if (normalizeFamilySlug(handleBase) === target) return true;
  if (handle.startsWith(`${target}-`)) return true;

  return false;
}

export function findModelFamily(
  modelLinks: ModelFilterLink[],
  familySlug: string,
): ModelFilterLink | undefined {
  const target = normalizeFamilySlug(familySlug);
  return modelLinks.find((link) => normalizeFamilySlug(familySlugFromHref(link.href)) === target);
}

export function resolveProductFamilyLink(
  product: SellProductDetail,
  modelLinks: ModelFilterLink[],
): { label: string; href: string } | undefined {
  const match = findModelFamily(modelLinks, familySlugFromHref(product.familyHref ?? ""));
  if (match) return { label: match.label, href: match.href };

  for (const link of modelLinks) {
    if (productMatchesFamily(product, familySlugFromHref(link.href))) {
      return { label: link.label, href: link.href };
    }
  }

  if (product.familyLabel && product.familyHref) {
    return { label: product.familyLabel, href: product.familyHref };
  }

  return undefined;
}
