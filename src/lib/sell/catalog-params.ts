export type SellCatalogSort = "position" | "name" | "low_to_high" | "high_to_low";

export type SellCatalogParams = {
  limit: number;
  page: number;
  sort: SellCatalogSort;
};

const ALLOWED_LIMITS = [16, 32, 64, 500] as const;

export function parseSellCatalogParams(
  searchParams: Record<string, string | string[] | undefined> = {},
): SellCatalogParams {
  const rawLimit = Number(getParam(searchParams, "product_list_limit") ?? "16");
  const limit = ALLOWED_LIMITS.includes(rawLimit as (typeof ALLOWED_LIMITS)[number])
    ? rawLimit
    : 16;

  const page = Math.max(1, Number(getParam(searchParams, "p") ?? "1") || 1);

  const sortRaw = getParam(searchParams, "product_list_order") ?? "position";
  const sort: SellCatalogSort =
    sortRaw === "name" || sortRaw === "low_to_high" || sortRaw === "high_to_low" ? sortRaw : "position";

  return { limit, page, sort };
}

function getParam(searchParams: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = searchParams[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

export function buildSellCatalogQuery(params: Partial<SellCatalogParams>): string {
  const limit = params.limit ?? 16;
  const page = params.page ?? 1;
  const sort = params.sort ?? "position";

  const qs = new URLSearchParams();
  if (limit !== 16) qs.set("product_list_limit", String(limit));
  if (page > 1) qs.set("p", String(page));
  if (sort !== "position") qs.set("product_list_order", sort);

  const query = qs.toString();
  return query ? `?${query}` : "";
}

export function sellBrandCatalogPath(category: string, brand: string, params?: Partial<SellCatalogParams>): string {
  const base = category === "mobile" ? `/sell-my/mobile/${brand}` : `/sell-my/${category}/${brand}`;
  return `${base}${buildSellCatalogQuery(params ?? {})}`;
}
