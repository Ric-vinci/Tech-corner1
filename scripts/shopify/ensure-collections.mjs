import { adminRequest, resolveImageUrl } from "./admin-client.mjs";
import { CATEGORIES, MOBILE_BRANDS } from "./catalog-data.mjs";

const COLLECTION_BY_HANDLE = `
  query CollectionByHandle($handle: String!) {
    collectionByHandle(handle: $handle) { id handle }
  }
`;

const COLLECTION_CREATE = `
  mutation CollectionCreate($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection { id handle title }
      userErrors { field message }
    }
  }
`;

const COLLECTION_UPDATE = `
  mutation CollectionUpdate($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection { id handle title }
      userErrors { field message }
    }
  }
`;

function mf(key, type, value) {
  return { namespace: "catalog", key, type, value: String(value) };
}

async function getCollectionId(handle) {
  const data = await adminRequest(COLLECTION_BY_HANDLE, { handle });
  return data.collectionByHandle?.id ?? null;
}

async function upsertSmartCollection({ handle, title, rules, metafields = [] }) {
  const existingId = await getCollectionId(handle);

  const input = {
    title,
    ruleSet: { appliedDisjunctively: false, rules },
    metafields,
  };

  if (existingId) {
    const data = await adminRequest(COLLECTION_UPDATE, { input: { id: existingId, ...input } });
    const errors = data.collectionUpdate.userErrors ?? [];
    if (errors.length) throw new Error(`collectionUpdate(${handle}): ${JSON.stringify(errors)}`);
    return { handle, action: "updated" };
  }

  const data = await adminRequest(COLLECTION_CREATE, {
    input: { handle, ...input },
  });
  const errors = data.collectionCreate.userErrors ?? [];
  if (errors.length) throw new Error(`collectionCreate(${handle}): ${JSON.stringify(errors)}`);
  return { handle, action: "created" };
}

export async function ensureCollections() {
  console.log("Ensuring Shopify collections...");

  for (const cat of CATEGORIES) {
    const result = await upsertSmartCollection({
      handle: cat.handle,
      title: cat.title,
      rules: [{ column: "TAG", relation: "EQUALS", condition: cat.tag }],
      metafields: [
        mf("category_slug", "single_line_text_field", cat.categorySlug),
        mf("hero_image_url", "url", resolveImageUrl(cat.heroImage)),
        mf("sell_href", "single_line_text_field", cat.sellHref),
        mf("buy_href", "single_line_text_field", cat.buyHref),
        mf("layout_type", "single_line_text_field", cat.layout),
        mf("card_label", "single_line_text_field", cat.sellTitle),
      ],
    });
    console.log(`  ${result.handle}: ${result.action}`);
  }

  for (const brand of MOBILE_BRANDS) {
    const handle = `${brand.slug}-mobile`;
    const title = `${brand.label} Mobile`;
    const metafields = [
      mf("category_slug", "single_line_text_field", "mobile"),
      mf("parent_handle", "single_line_text_field", "mobile-phones"),
      mf("brand_slug", "single_line_text_field", brand.slug),
      mf("sell_href", "single_line_text_field", `/sell-my/mobile/${brand.slug}`),
      mf("buy_href", "single_line_text_field", `/buy-used/mobile-phones/${brand.slug}`),
      mf("card_label", "single_line_text_field", brand.cardLabel),
    ];

    if (brand.logo) {
      metafields.push(mf("brand_logo_url", "url", resolveImageUrl(brand.logo)));
    }
    if (brand.heroImage) {
      metafields.push(mf("hero_image_url", "url", resolveImageUrl(brand.heroImage)));
    }

    const result = await upsertSmartCollection({
      handle,
      title,
      rules: [
        { column: "TAG", relation: "EQUALS", condition: "category:mobile" },
        { column: "TAG", relation: "EQUALS", condition: `brand:${brand.slug}` },
      ],
      metafields,
    });
    console.log(`  ${result.handle}: ${result.action}`);
  }
}
