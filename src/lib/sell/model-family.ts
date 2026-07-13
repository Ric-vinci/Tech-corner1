import type { ModelFilterLink, SellProductDetail } from "@/data/types";

export function normalizeFamilySlug(slug: string): string {
  return slug.replace(/^trade-in-your-/, "").toLowerCase();
}

export function familySlugFromHref(href: string): string {
  return href.split("/").pop() ?? "";
}

export function productMatchesFamily(product: SellProductDetail, familySlug: string): boolean {
  const target = normalizeFamilySlug(familySlug);

  if (product.familyHref) {
    const productFamily = normalizeFamilySlug(familySlugFromHref(product.familyHref));
    if (productFamily === target) return true;
  }

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
