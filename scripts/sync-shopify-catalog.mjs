#!/usr/bin/env node
/**
 * Push catalog (product names, categories, trade-in prices) to Shopify.
 * Images are NOT uploaded — only external URLs saved in catalog.image_url metafield.
 *
 * Usage:
 *   1. Copy .env.example → .env.local and fill in Shopify credentials
 *   2. Set IMAGE_CDN_BASE_URL to your cloud storage base URL
 *   3. npm run sync:shopify
 */
import { requireAdminConfig } from "./shopify/admin-client.mjs";
import { ensureMetafieldDefinitions } from "./shopify/ensure-metafields.mjs";
import { ensureCollections } from "./shopify/ensure-collections.mjs";
import { ensureMenus } from "./shopify/ensure-menus.mjs";
import { syncSamsungProducts } from "./shopify/sync-products.mjs";

async function main() {
  requireAdminConfig();

  console.log("=== Tech Corner → Shopify catalog sync ===\n");

  await ensureMetafieldDefinitions();
  console.log("");
  await ensureCollections();
  console.log("");
  await ensureMenus();
  console.log("");
  await syncSamsungProducts();

  console.log("\nNext steps:");
  console.log("  • Upload hero images to S3: npm run assets:manifest");
  console.log("  • Run Supabase migration: npm run supabase:migrate (or SQL Editor)");
  console.log("  • Optional: add write_publications scope and publish collections to Storefront");
  console.log("  • Set SHOPIFY_USE_STATIC_FALLBACK=false in production");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
