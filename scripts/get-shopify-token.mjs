#!/usr/bin/env node
/**
 * One-time helper: get a permanent Admin API token for a Shopify store.
 *
 * Shopify's Dev Dashboard apps (which replaced custom apps in January 2026) only
 * hand out a Client ID + Secret. Those can't call the Admin API — they have to be
 * exchanged for an access token by installing the app on a specific store.
 *
 * Doing that by hand means copying a `code` out of the address bar and posting it
 * within about a minute. This script removes the race: it runs the callback
 * server itself, catches the code, and exchanges it immediately.
 *
 *   node scripts/get-shopify-token.mjs
 *
 * The resulting shpat_ token never expires, so this is a run-once script.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SHOP = process.env.SHOP_DOMAIN || "tech-corner-9576.myshopify.com";
const CLIENT_ID = process.env.SHOPIFY_APP_CLIENT_ID || "cc2e77ed88ee38b4469a58f44318b807";
const PORT = 3000;
const CALLBACK_PATH = "/shopify-callback";

const SCOPES = [
  // Admin API — refurb units, pricing metafields, publishing, payouts.
  "read_products", "write_products",
  "read_inventory", "write_inventory",
  "read_publications", "write_publications",
  "read_gift_cards", "write_gift_cards",
  "read_gift_card_transactions", "write_gift_card_transactions",
  // Storefront API — public catalogue and menu reads. Without at least one
  // unauthenticated_* scope, storefrontAccessTokenCreate is denied and public
  // pages would have to read through the Admin token, which can also write.
  "unauthenticated_read_product_listings",
  "unauthenticated_read_product_inventory",
  "unauthenticated_read_product_tags",
  "unauthenticated_read_content",
].join(",");

// The secret lives in .env.local (gitignored) so it never reaches the shell history.
function clientSecret() {
  if (process.env.SHOPIFY_APP_CLIENT_SECRET) return process.env.SHOPIFY_APP_CLIENT_SECRET.trim();
  const envPath = path.join(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^SHOPIFY_APP_CLIENT_SECRET=(.*)$/);
      if (m) return m[1].replace(/^["']|["']$/g, "").trim();
    }
  }
  return null;
}

const SECRET = clientSecret();
if (!SECRET) {
  console.error(`
Missing the app's Key (client secret).

Add this line to .env.local, then run again:

  SHOPIFY_APP_CLIENT_SECRET=shpss_xxxxxxxxxxxx

Get it from: Dev Dashboard -> your app -> Settings -> Login details -> Key
`);
  process.exit(1);
}

const authorizeUrl =
  `https://${SHOP}/admin/oauth/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&scope=${SCOPES}` +
  `&redirect_uri=http://localhost:${PORT}${CALLBACK_PATH}` +
  `&state=tc3setup`;

const reply = (res, code, message) => {
  res.writeHead(code, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<html><body style="font-family:system-ui;padding:40px;text-align:center">${message}</body></html>`);
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== CALLBACK_PATH) return reply(res, 404, "Not this page.");

  const code = url.searchParams.get("code");
  if (!code) return reply(res, 400, "<h2>No code returned</h2><p>Shopify did not send an approval code.</p>");

  console.log("\nGot the approval code. Exchanging it for a token...");

  try {
    const r = await fetch(`https://${SHOP}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: SECRET, code }),
    });
    const json = await r.json();

    if (!r.ok || !json.access_token) {
      console.error("\nExchange failed:", JSON.stringify(json));
      reply(res, 400, "<h2>Exchange failed</h2><p>Check the terminal.</p>");
      return server.close(() => process.exit(1));
    }

    // Public pages should read through a Storefront token, not the Admin one —
    // the Admin token can write. This needs an unauthenticated_* scope above.
    let storefrontToken = null;
    try {
      const sfRes = await fetch(`https://${SHOP}/admin/api/2026-01/graphql.json`, {
        method: "POST",
        headers: { "X-Shopify-Access-Token": json.access_token, "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `mutation { storefrontAccessTokenCreate(input: { title: "Tech Corner Website" }) {
            storefrontAccessToken { accessToken }
            userErrors { field message }
          } }`,
        }),
      });
      const sf = await sfRes.json();
      storefrontToken = sf?.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken ?? null;
      if (!storefrontToken) {
        const why = sf?.errors ? JSON.stringify(sf.errors) : JSON.stringify(sf?.data?.storefrontAccessTokenCreate?.userErrors ?? sf);
        console.log(`\nNote: could not create a Storefront token — ${why.slice(0, 200)}`);
      }
    } catch (e) {
      console.log(`\nNote: Storefront token request failed — ${e.message}`);
    }

    console.log(`
============================================================
SUCCESS — permanent tokens for ${SHOP}

Add to .env.local (and later to Vercel):

  SHOPIFY_STORE_DOMAIN=${SHOP}
  SHOPIFY_ADMIN_ACCESS_TOKEN=${json.access_token}${
    storefrontToken ? `\n  SHOPIFY_STOREFRONT_ACCESS_TOKEN=${storefrontToken}` : ""
  }

Granted scopes:
${json.scope}
${storefrontToken ? "" : "\nNo Storefront token: add the unauthenticated_* scopes to the app\nin the Dev Dashboard, publish a new version, then run this again.\n"}
Neither token expires. You will not need this script again.
============================================================
`);
    reply(res, 200, "<h2>Done</h2><p>Your token is in the terminal. You can close this tab.</p>");
    server.close(() => process.exit(0));
  } catch (err) {
    console.error("\nRequest failed:", err.message);
    reply(res, 500, "<h2>Request failed</h2><p>Check the terminal.</p>");
    server.close(() => process.exit(1));
  }
});

server.listen(PORT, () => {
  console.log(`
Waiting for Shopify on http://localhost:${PORT}${CALLBACK_PATH}

Open this link in a browser where you are logged into the store,
then click Install. There is no time limit now - take as long as you like.

${authorizeUrl}
`);
});
