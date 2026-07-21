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
  "read_products", "write_products",
  "read_inventory", "write_inventory",
  "read_publications", "write_publications",
  "read_gift_cards", "write_gift_cards",
  "read_gift_card_transactions", "write_gift_card_transactions",
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

    console.log(`
============================================================
SUCCESS — your permanent Admin API token:

${json.access_token}

Granted scopes:
${json.scope}

Add to .env.local (and later to Vercel):

  SHOPIFY_STORE_DOMAIN=${SHOP}
  SHOPIFY_ADMIN_ACCESS_TOKEN=${json.access_token}

This token does not expire. You will not need this script again.
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
