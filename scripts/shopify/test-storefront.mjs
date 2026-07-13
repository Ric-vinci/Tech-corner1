import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, "../../.env.local"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  const k = t.slice(0, eq).trim();
  if (!process.env[k]) process.env[k] = t.slice(eq + 1).trim();
}

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const sfToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const version = process.env.SHOPIFY_API_VERSION ?? "2026-01";

async function storefront(query, variables = {}) {
  const res = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": sfToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

async function admin(query, variables = {}) {
  const res = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

console.log("=== Storefront API ===");
const sf = await storefront(`
  query {
    collection(handle: "mobile-phones") { id title handle }
    collections(first: 10) { nodes { handle title } }
    menu(handle: "sell-main-nav") { title items { title url } }
  }
`);
if (sf.errors) console.log("Errors:", sf.errors.map((e) => e.message).join("; "));
console.log("collection mobile-phones:", sf.data?.collection ? "OK" : "null");
console.log("collections:", sf.data?.collections?.nodes?.map((c) => c.handle).join(", ") ?? "none");
console.log("menu sell-main-nav:", sf.data?.menu ? `OK (${sf.data.menu.items?.length} items)` : "null");

const products = await storefront(`
  query {
    collection(handle: "samsung-mobile") {
      products(first: 3) { nodes { handle title } }
    }
  }
`);
console.log("samsung-mobile products:", products.data?.collection?.products?.nodes?.length ?? 0);

console.log("\n=== Publish test (Admin) ===");
const pub = await admin(`
  mutation($id: ID!) {
    publishablePublishToCurrentChannel(id: $id) {
      userErrors { message }
    }
  }
`, { id: "gid://shopify/Collection/523237785813" });
console.log("publish mobile-phones:", pub.errors?.[0]?.message ?? pub.data?.publishablePublishToCurrentChannel?.userErrors?.[0]?.message ?? "OK");
