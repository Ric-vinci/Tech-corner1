import fs from "fs";
import path from "path";

const BASE = "https://www.4gadgets.co.uk/sell-my/mobile/samsung";
const PER_PAGE = 16;

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "text/html",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function parseProducts(html) {
  const products = [];
  const seen = new Set();

  for (const block of html.split('class="product_addtocart_form').slice(1)) {
    const linkMatch = block.match(
      /class="product-item-link"[\s\S]*?href="[^"]*\/sell-my\/([^"?]+)(?:\.html)?"[\s\S]*?>\s*([^<]+)/,
    );
    const imgMatch = block.match(
      /src="(https:\/\/www\.4gadgets\.co\.uk\/media\/catalog\/product\/[^"]+\.(?:jpg|png|webp))"/,
    );
    const priceMatch =
      block.match(/hyva\.formatPrice\('([0-9.]+)'\)/) ||
      block.match(/Get up to\s*<span[^>]*>£([0-9.]+)<\/span>/);
    if (!linkMatch) continue;

    let slug = linkMatch[1].trim();
    if (!slug.endsWith(".html")) slug += ".html";
    if (seen.has(slug)) continue;
    seen.add(slug);

    products.push({
      slug,
      name: linkMatch[2].trim().replace(/\s+/g, " "),
      image: imgMatch ? imgMatch[1] : "/images/MicrosoftTeams-image_5_.png",
      price: priceMatch ? `Get up to £${priceMatch[1]}` : "Get a quote",
      href: `/sell-my/${slug}`,
    });
  }

  return products;
}

function cleanSlug(raw) {
  return raw.split("?")[0].replace(/\/$/, "");
}

function parseModelLinks(html) {
  const models = [];
  const seen = new Set();

  const re =
    /href="[^"]*\/sell-my\/mobile\/samsung\/([^"?]+)(?:\?[^"]*)?"[\s\S]*?<span>([^<]+)<\/span>[\s\S]*?(?:<span class="count[^"]*">\((\d+)\)<\/span>)?/g;

  for (const m of html.matchAll(re)) {
    const slug = cleanSlug(m[1]);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    models.push({
      slug,
      label: m[2].trim().replace(/\s+/g, " "),
      href: `/sell-my/mobile/samsung/${slug}`,
      count: m[3] ? Number(m[3]) : 1,
    });
  }

  return models;
}

function parseTotal(html) {
  const m = html.match(/class="toolbar-number total-amount">(\d+)/);
  return m ? Number(m[1]) : undefined;
}

async function main() {
  const firstUrl = `${BASE}?product_list_limit=${PER_PAGE}`;
  console.log(`Fetching ${firstUrl}...`);
  const firstHtml = await fetchPage(firstUrl);

  const totalProducts = parseTotal(firstHtml) ?? 250;
  const modelLinks = parseModelLinks(firstHtml);
  const products = parseProducts(firstHtml);

  const pages = Math.ceil(totalProducts / PER_PAGE);
  for (let p = 2; p <= pages; p++) {
    console.log(`Fetching page ${p}/${pages}...`);
    const html = await fetchPage(`${BASE}?p=${p}&product_list_limit=${PER_PAGE}`);
    for (const product of parseProducts(html)) {
      if (!products.find((x) => x.slug === product.slug)) products.push(product);
    }
  }

  const outDir = "src/data/generated";
  fs.mkdirSync(outDir, { recursive: true });
  const out = {
    totalProducts,
    products,
    modelLinks,
    fetchedAt: new Date().toISOString(),
    source: BASE,
  };
  fs.writeFileSync(path.join(outDir, "samsung-mobile.json"), JSON.stringify(out, null, 2));
  console.log(`Wrote ${products.length} products, ${modelLinks.length} model links (total: ${totalProducts})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
