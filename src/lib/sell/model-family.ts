import type { ModelFilterLink, SellProductDetail } from "@/data/types";

export function normalizeFamilySlug(slug: string): string {
  return slug.replace(/^trade-in-your-/, "").toLowerCase();
}

export function familySlugFromHref(href: string): string {
  return href.split("/").pop() ?? "";
}

const BRAND_PREFIX = /^(apple|samsung|google|huawei|oneplus|sony|nokia|motorola|xiaomi|oppo|realme|honor|nothing|lg|htc|zte|blackberry|redmi)[\s-]+/i;

/** Product's model slug, brand-agnostic: "Apple iPhone 8 256GB" → "iphone-8". */
export function productModelSlug(name: string): string {
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
  // Compare with separators stripped too, since the reference slugs merge digits
  // inconsistently ("pixel2" vs "pixel-2", "pixel-3xl" vs "pixel-3-xl").
  const compact = (s: string) => s.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const modelSlug = productModelSlug(product.name);
  const targetNoBrand = target.replace(BRAND_PREFIX, "");
  if (modelSlug) {
    if (modelSlug === target || modelSlug === targetNoBrand) return true;
    if (compact(modelSlug) === compact(target) || compact(modelSlug) === compact(targetNoBrand)) return true;
  }

  const handle = product.href.replace("/sell-my/", "").replace(/\.html$/, "");
  const handleBase = handle.replace(/-\d+(\.\d+)?(gb|tb)$/i, "");
  if (normalizeFamilySlug(handleBase) === target) return true;
  if (handle.startsWith(`${target}-`)) return true;

  return false;
}

/**
 * Match against a sidebar link, falling back to its label when the slug finds
 * nothing. Some reference slugs disagree with their own label — Huawei's
 * "huawei-p20-plus" is labelled "Huawei P20 Pro", and the product is a P20 Pro
 * — so the label is the more reliable identifier of the two.
 */
export function productMatchesFamilyLink(
  product: SellProductDetail,
  link: { href: string; label: string },
): boolean {
  if (productMatchesFamily(product, familySlugFromHref(link.href))) return true;

  const labelSlug = productModelSlug(link.label.replace(/^\s*(?:trade in|sell)\s+your\s+/i, ""));
  return labelSlug.length > 0 && productMatchesFamily(product, labelSlug);
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
