#!/usr/bin/env node
/**
 * Prints S3 upload paths for brand logos and hero banners.
 * Upload files from public/images/ to your S3 bucket using these keys.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CATEGORIES, MOBILE_BRANDS } from "./shopify/catalog-data.mjs";
import { resolveImageUrl } from "./shopify/admin-client.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "../public");

function localPath(urlPath) {
  return path.join(PUBLIC, urlPath.replace(/^\//, "").replace(/\//g, path.sep));
}

const assets = [];

for (const cat of CATEGORIES) {
  assets.push({ type: "hero", label: cat.handle, local: cat.heroImage, s3: resolveImageUrl(cat.heroImage) });
}

for (const brand of MOBILE_BRANDS) {
  if (brand.logo) assets.push({ type: "brand-logo", label: brand.slug, local: brand.logo, s3: resolveImageUrl(brand.logo) });
  if (brand.heroImage) assets.push({ type: "brand-hero", label: brand.slug, local: brand.heroImage, s3: resolveImageUrl(brand.heroImage) });
}

console.log("=== Asset upload manifest ===\n");
console.log("Upload each local file to the matching S3 URL (key = path after bucket domain).\n");

let missing = 0;
for (const a of assets) {
  const exists = fs.existsSync(localPath(a.local));
  if (!exists) missing++;
  console.log(`${exists ? "OK" : "MISSING"}  ${a.type.padEnd(11)} ${a.label}`);
  console.log(`       local: ${a.local}`);
  console.log(`       s3:    ${a.s3}\n`);
}

if (missing) {
  console.log(`${missing} local file(s) missing — upload available files to S3 before sync.`);
}
