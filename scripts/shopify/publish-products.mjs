import { adminRequest, sleep } from "./admin-client.mjs";

const PRODUCTS = `
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { id handle title }
    }
  }
`;

const PUBLISH = `
  mutation PublishablePublishToCurrentChannel($id: ID!) {
    publishablePublishToCurrentChannel(id: $id) {
      userErrors { field message }
    }
  }
`;

let after = null;
let hasNext = true;
let ok = 0;
let fail = 0;

console.log("Publishing products to Headless/Storefront channel...");

while (hasNext) {
  const data = await adminRequest(PRODUCTS, { first: 50, after });
  for (const product of data.products.nodes) {
    try {
      const result = await adminRequest(PUBLISH, { id: product.id });
      const errors = result.publishablePublishToCurrentChannel?.userErrors ?? [];
      if (errors.length) {
        fail++;
        if (fail <= 3) console.log(`  FAIL ${product.handle}:`, errors[0].message);
      } else {
        ok++;
        if (ok % 50 === 0) console.log(`  ${ok} products published...`);
      }
    } catch (e) {
      fail++;
      if (fail <= 3) console.log(`  FAIL ${product.handle}:`, e.message.slice(0, 100));
    }
    await sleep(100);
  }
  hasNext = data.products.pageInfo.hasNextPage;
  after = data.products.pageInfo.endCursor;
}

console.log(`Done. Published: ${ok}, Failed: ${fail}`);
