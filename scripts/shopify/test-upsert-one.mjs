import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { slugToHandle, parseTradeInPrice } from "./admin-client.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { buildProductInput, upsertProduct } = await import("./sync-products.mjs");

const json = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../src/data/generated/samsung-mobile.json"), "utf8"),
);
const product = json.products[0];
const input = buildProductInput(product, {
  categorySlug: "mobile",
  brandSlug: "samsung",
  brandLabel: "Samsung",
});

console.log("Upserting:", input.handle);
const result = await upsertProduct(input);
console.log("OK:", result);
