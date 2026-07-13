import { createStorefrontApiClient } from "@shopify/storefront-api-client";
import { isShopifyConfigured, SHOPIFY_API_VERSION, SHOPIFY_STORE_DOMAIN, SHOPIFY_STOREFRONT_ACCESS_TOKEN } from "./config";

let client: ReturnType<typeof createStorefrontApiClient> | null = null;

export function getStorefrontClient() {
  if (!isShopifyConfigured()) {
    throw new Error("Shopify Storefront API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN.");
  }

  if (!client) {
    client = createStorefrontApiClient({
      storeDomain: SHOPIFY_STORE_DOMAIN,
      apiVersion: SHOPIFY_API_VERSION,
      publicAccessToken: SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    });
  }

  return client;
}

export async function storefrontRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const { data, errors } = await getStorefrontClient().request(query, { variables });

  if (errors) {
    const message = typeof errors === "string" ? errors : JSON.stringify(errors);
    throw new Error(`Shopify Storefront API error: ${message}`);
  }

  return data as T;
}
