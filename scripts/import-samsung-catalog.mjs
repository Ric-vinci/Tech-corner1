import fs from "fs";
import path from "path";

const LIVE_JSON = "src/data/generated/samsung-mobile.json";
const HTML_500 =
  "wapple_html/sell/mobile/samsung/samsung-galaxy/500/Sell Your Old Samsung Phone _ Trade-In Price Guaranteed.html";
const FILES_500 =
  "wapple_html/sell/mobile/samsung/samsung-galaxy/500/Sell Your Old Samsung Phone _ Trade-In Price Guaranteed_files";
const OUT_IMAGES = "public/images/sell/samsung";

function parseLocalImageMap(html) {
  const map = new Map();
  for (const block of html.split('class="product_addtocart_form').slice(1)) {
    const linkMatch = block.match(/href="[^"]*\/sell-my\/([^"?]+)(?:\.html)?"/);
    const imgMatch = block.match(/_files\/([^"]+\.(?:jpg|png|webp))"/);
    if (linkMatch && imgMatch) {
      let slug = linkMatch[1].trim();
      if (!slug.endsWith(".html")) slug += ".html";
      map.set(slug, path.basename(imgMatch[1]));
    }
  }
  return map;
}

function copyImages() {
  fs.mkdirSync(OUT_IMAGES, { recursive: true });
  if (!fs.existsSync(FILES_500)) return 0;
  let count = 0;
  for (const file of fs.readdirSync(FILES_500)) {
    if (!/\.(jpg|jpeg|png|webp)$/i.test(file)) continue;
    fs.copyFileSync(path.join(FILES_500, file), path.join(OUT_IMAGES, file));
    count++;
  }
  return count;
}

async function main() {
  if (!fs.existsSync(LIVE_JSON)) {
    console.error("Run npm run fetch:samsung first");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(LIVE_JSON, "utf8"));
  const html500 = fs.existsSync(HTML_500) ? fs.readFileSync(HTML_500, "utf8") : "";
  const imageMap = parseLocalImageMap(html500);
  const imagesCopied = copyImages();

  const products = data.products.map((p) => {
    const localFile = imageMap.get(p.slug);
    if (localFile && fs.existsSync(path.join(OUT_IMAGES, localFile))) {
      return { ...p, image: `/images/sell/samsung/${localFile}` };
    }
    if (p.image?.startsWith("https://")) {
      const remoteFile = path.basename(new URL(p.image).pathname);
      const localPath = path.join(OUT_IMAGES, remoteFile);
      if (fs.existsSync(localPath)) {
        return { ...p, image: `/images/sell/samsung/${remoteFile}` };
      }
    }
    return p;
  });

  const out = {
    ...data,
    products,
    defaultPerPage: 500,
    importedAt: new Date().toISOString(),
    localImages: imagesCopied,
  };

  fs.writeFileSync(LIVE_JSON, JSON.stringify(out, null, 2));
  console.log(
    JSON.stringify(
      {
        totalProducts: out.totalProducts,
        products: products.length,
        modelLinks: out.modelLinks?.length ?? 0,
        localImages: imagesCopied,
        mappedFrom500Html: imageMap.size,
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
