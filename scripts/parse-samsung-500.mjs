import fs from "fs";
import path from "path";

const HTML_PATH =
  "wapple_html/sell/mobile/samsung/samsung-galaxy/500/Sell Your Old Samsung Phone _ Trade-In Price Guaranteed.html";
const FILES_DIR =
  "wapple_html/sell/mobile/samsung/samsung-galaxy/500/Sell Your Old Samsung Phone _ Trade-In Price Guaranteed_files";
const OUT_IMAGES = "public/images/sell/samsung";
const OUT_JSON = "src/data/generated/samsung-mobile.json";

function cleanSlug(raw) {
  return raw.split("?")[0].replace(/\/$/, "");
}

function parseProducts(html) {
  const products = [];
  const seen = new Set();

  for (const block of html.split('class="product_addtocart_form').slice(1)) {
    const linkMatch = block.match(
      /class="product-item-link"[\s\S]*?href="[^"]*\/sell-my\/([^"?]+)(?:\.html)?"[\s\S]*?>\s*([^<]+)/,
    );
    const imgMatch =
      block.match(/_files\/([^"]+\.(?:jpg|png|webp))"/) ||
      block.match(/src="https:\/\/www\.4gadgets\.co\.uk\/media\/catalog\/product\/[^"]*\/([^"/]+\.(?:jpg|png|webp))"/);
    const priceMatch =
      block.match(/hyva\.formatPrice\('([0-9.]+)'\)/) ||
      block.match(/Get up to\s*<span[^>]*>£([0-9.]+)<\/span>/);

    if (!linkMatch) continue;
    let slug = linkMatch[1].trim();
    if (!slug.endsWith(".html")) slug += ".html";
    if (seen.has(slug)) continue;
    seen.add(slug);

    const imageFile = imgMatch ? path.basename(imgMatch[1]) : null;
    products.push({
      slug,
      name: linkMatch[2].trim().replace(/\s+/g, " "),
      imageFile,
      image: imageFile ? `/images/sell/samsung/${imageFile}` : "/images/MicrosoftTeams-image_5_.png",
      price: priceMatch ? `Get up to £${priceMatch[1]}` : "Get a quote",
      href: `/sell-my/${slug}`,
    });
  }

  return products;
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
  const html = fs.readFileSync(HTML_PATH, "utf8");
  const products = parseProducts(html);
  const modelLinks = parseModelLinks(html);
  const totalProducts = parseTotal(html) ?? products.length;

  fs.mkdirSync(OUT_IMAGES, { recursive: true });
  const copied = new Set();
  for (const product of products) {
    if (!product.imageFile || copied.has(product.imageFile)) continue;
    const src = path.join(FILES_DIR, product.imageFile);
    const dest = path.join(OUT_IMAGES, product.imageFile);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      copied.add(product.imageFile);
    }
  }

  const out = {
    totalProducts,
    products: products.map(({ imageFile, ...rest }) => rest),
    modelLinks,
    fetchedAt: new Date().toISOString(),
    source: HTML_PATH,
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2));

  console.log(
    JSON.stringify(
      {
        totalProducts,
        products: products.length,
        modelLinks: modelLinks.length,
        imagesCopied: copied.size,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
