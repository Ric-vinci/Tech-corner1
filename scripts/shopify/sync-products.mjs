import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  adminRequest,
  deriveFamily,
  parseTradeInPrice,
  resolveImageUrl,
  sleep,
  slugToHandle,
} from "./admin-client.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMSUNG_JSON = path.join(__dirname, "../../src/data/generated/samsung-mobile.json");

const PRODUCT_SET = `
  mutation ProductSet(
    $input: ProductSetInput!
    $synchronous: Boolean!
    $identifier: ProductSetIdentifiers
  ) {
    productSet(synchronous: $synchronous, input: $input, identifier: $identifier) {
      product { id handle title }
      userErrors { field message }
    }
  }
`;

export function buildProductInput(product, { categorySlug, brandSlug, brandLabel }) {
  const handle = slugToHandle(product.slug);
  const priceWorking = parseTradeInPrice(product.price);
  const priceFaulty = Math.max(5, Math.round(priceWorking * 0.25));
  const { familyLabel, familySlug } = deriveFamily(product.name);
  const imageUrl = resolveImageUrl(product.image);
  const sellPath = product.href ?? `/sell-my/${product.slug}`;
  const buyPath = `/buy-used/${handle}.html`;

  return {
    title: product.name,
    handle,
    vendor: brandLabel,
    productType: "Mobile Phones",
    status: "ACTIVE",
    tags: [`category:${categorySlug}`, `brand:${brandSlug}`],
    metafields: [
      { namespace: "catalog", key: "image_url", type: "url", value: imageUrl || "https://example.com/placeholder.png" },
      { namespace: "catalog", key: "category_slug", type: "single_line_text_field", value: categorySlug },
      { namespace: "catalog", key: "brand_slug", type: "single_line_text_field", value: brandSlug },
      { namespace: "catalog", key: "model_family_slug", type: "single_line_text_field", value: familySlug },
      { namespace: "catalog", key: "model_family_label", type: "single_line_text_field", value: familyLabel },
      { namespace: "catalog", key: "sell_path", type: "single_line_text_field", value: sellPath },
      { namespace: "catalog", key: "buy_path", type: "single_line_text_field", value: buyPath },
      { namespace: "trade_in", key: "price_working", type: "number_decimal", value: priceWorking.toFixed(2) },
      { namespace: "trade_in", key: "price_faulty", type: "number_decimal", value: priceFaulty.toFixed(2) },
      { namespace: "trade_in", key: "price_no_power", type: "number_decimal", value: "0.00" },
    ],
    productOptions: [{ name: "Title", values: [{ name: "Default Title" }] }],
    variants: [
      {
        optionValues: [{ optionName: "Title", name: "Default Title" }],
        price: priceWorking.toFixed(2),
        inventoryPolicy: "CONTINUE",
        inventoryItem: { tracked: false },
      },
    ],
  };
}

export async function upsertProduct(input) {
  const { handle, ...fields } = input;
  const data = await adminRequest(PRODUCT_SET, {
    input: { handle, ...fields },
    identifier: { handle },
    synchronous: true,
  });
  const errors = data.productSet.userErrors ?? [];
  if (errors.length) {
    throw new Error(`productSet(${input.handle}): ${JSON.stringify(errors)}`);
  }
  return data.productSet.product;
}

export async function syncSamsungProducts({ delayMs = 300 } = {}) {
  if (!fs.existsSync(SAMSUNG_JSON)) {
    console.error("Samsung catalog not found. Run: npm run fetch:samsung && npm run import:samsung");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(SAMSUNG_JSON, "utf8"));
  const products = data.products ?? [];
  console.log(`Syncing ${products.length} Samsung products to Shopify...`);
  console.log("Images stored as external URLs in catalog.image_url metafield (not uploaded to Shopify).");

  let created = 0;
  let failed = 0;

  for (const [index, product] of products.entries()) {
    const input = buildProductInput(product, {
      categorySlug: "mobile",
      brandSlug: "samsung",
      brandLabel: "Samsung",
    });

    try {
      await upsertProduct(input);
      created++;
      if ((index + 1) % 25 === 0 || index === products.length - 1) {
        console.log(`  ${index + 1}/${products.length} synced`);
      }
    } catch (error) {
      failed++;
      console.error(`  FAILED ${input.handle}: ${error.message}`);
    }

    if (delayMs > 0 && index < products.length - 1) {
      await sleep(delayMs);
    }
  }

  console.log(`Done. Synced: ${created}, Failed: ${failed}`);
  return { created, failed, total: products.length };
}
