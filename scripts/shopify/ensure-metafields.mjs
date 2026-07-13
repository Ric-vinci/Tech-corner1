import { adminRequest } from "./admin-client.mjs";

const PRODUCT_DEFINITIONS = [
  { name: "Image URL", namespace: "catalog", key: "image_url", type: "url", description: "External CDN image URL (images are not stored in Shopify)" },
  { name: "Category slug", namespace: "catalog", key: "category_slug", type: "single_line_text_field" },
  { name: "Brand slug", namespace: "catalog", key: "brand_slug", type: "single_line_text_field" },
  { name: "Model family slug", namespace: "catalog", key: "model_family_slug", type: "single_line_text_field" },
  { name: "Model family label", namespace: "catalog", key: "model_family_label", type: "single_line_text_field" },
  { name: "Sell path", namespace: "catalog", key: "sell_path", type: "single_line_text_field" },
  { name: "Buy path", namespace: "catalog", key: "buy_path", type: "single_line_text_field" },
  { name: "Trade-in price (working)", namespace: "trade_in", key: "price_working", type: "number_decimal" },
  { name: "Trade-in price (faulty)", namespace: "trade_in", key: "price_faulty", type: "number_decimal" },
  { name: "Trade-in price (no power)", namespace: "trade_in", key: "price_no_power", type: "number_decimal" },
];

const COLLECTION_DEFINITIONS = [
  { name: "Category slug", namespace: "catalog", key: "category_slug", type: "single_line_text_field" },
  { name: "Parent category handle", namespace: "catalog", key: "parent_handle", type: "single_line_text_field" },
  { name: "Hero image URL", namespace: "catalog", key: "hero_image_url", type: "url", description: "External CDN hero banner URL" },
  { name: "Brand logo URL", namespace: "catalog", key: "brand_logo_url", type: "url", description: "External CDN brand logo URL" },
  { name: "Card label", namespace: "catalog", key: "card_label", type: "single_line_text_field" },
  { name: "Sell href", namespace: "catalog", key: "sell_href", type: "single_line_text_field" },
  { name: "Buy href", namespace: "catalog", key: "buy_href", type: "single_line_text_field" },
  { name: "Brand slug", namespace: "catalog", key: "brand_slug", type: "single_line_text_field" },
  { name: "Layout type", namespace: "catalog", key: "layout_type", type: "single_line_text_field" },
];

const CREATE_DEFINITION = `
  mutation MetafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition { id name }
      userErrors { field message code }
    }
  }
`;

async function ensureDefinition(definition, ownerType) {
  const data = await adminRequest(CREATE_DEFINITION, {
    definition: {
      ...definition,
      ownerType,
      access: {
        storefront: "PUBLIC_READ",
      },
    },
  });

  const errors = data.metafieldDefinitionCreate.userErrors ?? [];
  const alreadyExists = errors.some(
    (e) => e.code === "TAKEN" || e.message?.includes("taken") || e.message?.includes("already"),
  );

  if (errors.length && !alreadyExists) {
    throw new Error(`metafieldDefinitionCreate(${definition.namespace}.${definition.key}): ${JSON.stringify(errors)}`);
  }

  return alreadyExists ? "exists" : "created";
}

export async function ensureMetafieldDefinitions() {
  console.log("Ensuring Shopify metafield definitions...");

  for (const def of PRODUCT_DEFINITIONS) {
    const status = await ensureDefinition(def, "PRODUCT");
    console.log(`  product.${def.namespace}.${def.key}: ${status}`);
  }

  for (const def of COLLECTION_DEFINITIONS) {
    const status = await ensureDefinition(def, "COLLECTION");
    console.log(`  collection.${def.namespace}.${def.key}: ${status}`);
  }
}
