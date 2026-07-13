import { adminRequest } from "./admin-client.mjs";

const COLLECTIONS = `
  query {
    collections(first: 50) {
      nodes { id handle title }
    }
  }
`;

const PUBLISH = `
  mutation PublishablePublishToCurrentChannel($id: ID!) {
    publishablePublishToCurrentChannel(id: $id) {
      publishable { ... on Collection { handle } }
      userErrors { field message }
    }
  }
`;

const collections = (await adminRequest(COLLECTIONS)).collections.nodes;
console.log(`Publishing ${collections.length} collections to Headless/Storefront channel...`);

let ok = 0;
let fail = 0;
for (const col of collections) {
  if (col.handle === "frontpage") continue;
  try {
    const result = await adminRequest(PUBLISH, { id: col.id });
    const errors = result.publishablePublishToCurrentChannel?.userErrors ?? [];
    if (errors.length) {
      console.log(`  FAIL ${col.handle}:`, errors[0].message);
      fail++;
    } else {
      console.log(`  OK   ${col.handle}`);
      ok++;
    }
  } catch (e) {
    console.log(`  FAIL ${col.handle}:`, e.message.slice(0, 120));
    fail++;
  }
}
console.log(`Done. Published: ${ok}, Failed: ${fail}`);
