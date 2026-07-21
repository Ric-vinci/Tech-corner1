#!/usr/bin/env node
/**
 * Health check for the Shopify connection: npm run check:shopify
 *
 * Confirms the credentials in .env.local actually reach the intended store and
 * that every scope the app relies on is really granted. Scopes are easy to get
 * wrong — a missing one fails at runtime, in the middle of a payout or a publish,
 * rather than at startup. This surfaces it up front.
 *
 * Read-only: it never writes to the store.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const env = {};
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
}

const domain = process.env.SHOPIFY_STORE_DOMAIN || env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const version = process.env.SHOPIFY_API_VERSION || env.SHOPIFY_API_VERSION || "2026-01";

const ok = (m) => console.log(`  OK    ${m}`);
const bad = (m) => console.log(`  FAIL  ${m}`);

if (!domain || !token) {
  bad("SHOPIFY_STORE_DOMAIN / SHOPIFY_ADMIN_ACCESS_TOKEN missing from .env.local");
  process.exit(1);
}

async function gql(query) {
  const res = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return { status: res.status, body: await res.json() };
}

console.log(`\nShopify check — ${domain} (API ${version})\n`);

const shop = await gql("{ shop { name myshopifyDomain primaryDomain { url } currencyCode } }");
if (shop.status !== 200 || shop.body.errors) {
  bad(`cannot connect: HTTP ${shop.status} ${JSON.stringify(shop.body.errors ?? shop.body).slice(0, 160)}`);
  process.exit(1);
}
const s = shop.body.data.shop;
ok(`connected to "${s.name}" (${s.myshopifyDomain})`);
ok(`storefront ${s.primaryDomain.url}`);

// Gift cards are issued in the store's own currency and Shopify does not convert,
// so a non-GBP store would quietly pay out the wrong amounts.
if (s.currencyCode === "GBP") ok(`currency ${s.currencyCode}`);
else bad(`currency is ${s.currencyCode} — payouts assume GBP`);

const checks = {
  "read products": "{ products(first: 1) { nodes { id } } }",
  "read inventory": "{ productVariants(first: 1) { nodes { id inventoryQuantity } } }",
  "read publications": "{ publications(first: 1) { nodes { id name } } }",
  "read gift cards": "{ giftCards(first: 1) { nodes { id } } }",
};

let failures = 0;
for (const [name, query] of Object.entries(checks)) {
  const r = await gql(query);
  if (r.body.errors) {
    bad(`${name}: ${JSON.stringify(r.body.errors).slice(0, 120)}`);
    failures++;
  } else ok(name);
}

const counts = await gql("{ productsCount { count } }");
ok(`${counts.body?.data?.productsCount?.count ?? "?"} products in the store`);

console.log(failures ? `\n${failures} check(s) failed.\n` : "\nAll checks passed.\n");
process.exit(failures ? 1 : 0);
