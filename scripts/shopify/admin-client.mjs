import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile() {
  const envPath = path.join(__dirname, "../../.env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

export const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "";
export const SHOPIFY_ADMIN_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ?? "";
export const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-01";
export const IMAGE_CDN_BASE_URL = (process.env.IMAGE_CDN_BASE_URL ?? "").replace(/\/$/, "");
export const NEXT_PUBLIC_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

export function requireAdminConfig() {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_ACCESS_TOKEN) {
    console.error(
      "Missing Shopify Admin credentials.\n" +
        "Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local\n" +
        "See .env.example for details.",
    );
    process.exit(1);
  }
}

export async function adminRequest(query, variables = {}) {
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify Admin HTTP ${res.status}: ${text}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`Shopify Admin GraphQL: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeImagePath(image) {
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

export function resolveImageUrl(image) {
  if (!image) return "";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  const path = normalizeImagePath(image);
  if (IMAGE_CDN_BASE_URL && path.startsWith("/")) return `${IMAGE_CDN_BASE_URL}${path}`;
  if (NEXT_PUBLIC_SITE_URL && path.startsWith("/")) return `${NEXT_PUBLIC_SITE_URL}${path}`;
  return path;
}

export function slugToHandle(slug) {
  return slug.replace(/\.html$/, "");
}

export function parseTradeInPrice(priceText) {
  const match = priceText?.match(/£([\d.]+)/);
  return match ? parseFloat(match[1]) : 20;
}

export function deriveFamily(productName) {
  const familyName = productName.replace(/\s+\d+(\.\d+)?(GB|TB)$/i, "");
  const familySlug = `trade-in-your-${familyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
  return {
    familyName,
    familyLabel: `Trade In Your ${familyName}`,
    familySlug,
  };
}
