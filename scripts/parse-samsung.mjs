import fs from "fs";
import path from "path";

const html = fs.readFileSync(
  "wapple_html/sell/mobile/samsung/Sell Your Old Samsung Phone _ Trade-In Price Guaranteed.html",
  "utf8"
);

const blocks = html.split('class="product_addtocart_form');
const products = [];

for (const block of blocks.slice(1)) {
  const linkMatch = block.match(/class="product-item-link" href="[^"]*\/sell-my\/([^"]+)"[^>]*>\s*([^<]+)/);
  const imgMatch = block.match(/_files\/([^"]+\.(?:jpg|png|webp))"/);
  const priceMatch = block.match(/Get up to\s*<span[^>]*>£([0-9.]+)<\/span>/);
  if (!linkMatch) continue;
  products.push({
    slug: linkMatch[1].trim(),
    name: linkMatch[2].trim(),
    image: imgMatch ? `/images/sell/samsung/${imgMatch[1]}` : "/images/MicrosoftTeams-image_5_.png",
    price: priceMatch ? `Get up to £${priceMatch[1]}` : "Get a quote",
    href: `/sell-my/${linkMatch[1].trim()}`,
  });
}

const modelLinks = [...html.matchAll(/href="[^"]*sell-my\/mobile\/samsung\/([^"]+)"[^>]*>\s*<span>(Trade In Your[^<]+)<\/span>/g)].map((m) => ({
  slug: m[1],
  label: m[2],
  href: `/sell-my/mobile/samsung/${m[1]}`,
}));

const outDir = "src/data/generated";
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "samsung-mobile.json"), JSON.stringify({ products, modelLinks }, null, 2));
console.log(`Wrote ${products.length} products, ${modelLinks.length} model links`);
