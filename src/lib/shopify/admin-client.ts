import {
  isShopifyAdminConfigured,
  SHOPIFY_ADMIN_ACCESS_TOKEN,
  SHOPIFY_API_VERSION,
  SHOPIFY_STORE_DOMAIN,
} from "./config";

export { isShopifyAdminConfigured };

type AdminRequestOptions = {
  /**
   * Admin screens must see live data — after a mutation the very next read has to
   * reflect it. Catalog reads keep the default 1h cache for performance, so pass
   * `noStore: true` from any admin list read or mutation.
   */
  noStore?: boolean;
};

export async function adminRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: AdminRequestOptions,
): Promise<T> {
  if (!isShopifyAdminConfigured()) {
    throw new Error("Shopify Admin API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN.");
  }

  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    ...(options?.noStore ? { cache: "no-store" } : { next: { revalidate: 3600 } }),
  });

  if (!res.ok) {
    throw new Error(`Shopify Admin HTTP ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`Shopify Admin GraphQL: ${JSON.stringify(json.errors)}`);
  }

  return json.data as T;
}
