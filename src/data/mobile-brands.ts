import type { BrandItem } from "./types";
import { resolveImageUrl } from "@/lib/shopify/config";

/** Canonical mobile brand order and labels — matches 4gadgets.co.uk/sell-my/mobile */
export const MOBILE_BRANDS: BrandItem[] = [
  {
    label: "Samsung",
    slug: "samsung",
    href: "/sell-my/mobile/samsung",
    image: "/images/brands/SAMSUNG_1_1.png",
    cardLabel: "Trade In Your Samsung Mobile Phone",
    heroImage: "/images/Mobile_Phones_-_Samsung_Child__1_2.png",
  },
  { label: "Apple", slug: "apple", href: "/sell-my/mobile/apple", image: "/images/brands/APPLE.png", cardLabel: "Trade In Your iPhone" },
  { label: "Google", slug: "google", href: "/sell-my/mobile/google", image: "/images/brands/GOOGLE_PIXEL_1.png", cardLabel: "Trade In Your Google Pixel" },
  { label: "Huawei", slug: "huawei", href: "/sell-my/mobile/huawei", image: "/images/brands/HUAWEI.png", cardLabel: "Trade In Your Huawei Mobile Phone" },
  { label: "Honor", slug: "honor", href: "/sell-my/mobile/honor", image: "/images/brands/HONOR.png", cardLabel: "Trade In Your Honor Mobile Phone" },
  { label: "Oppo", slug: "oppo", href: "/sell-my/mobile/oppo", image: "/images/brands/OPPO.png", cardLabel: "Trade In Your Oppo Mobile Phone" },
  { label: "OnePlus", slug: "oneplus", href: "/sell-my/mobile/oneplus", image: "/images/brands/ONEPLUS.png", cardLabel: "Trade In Your OnePlus Mobile Phone" },
  { label: "Cat", slug: "cat", href: "/sell-my/mobile/cat", image: "/images/brands/CAT.png", cardLabel: "Trade In Your Cat Mobile Phone" },
  { label: "Blackberry", slug: "blackberry", href: "/sell-my/mobile/blackberry", image: "/images/brands/BLACKBERRY.png", cardLabel: "Trade In Your Blackberry Mobile Phone" },
  { label: "HTC", slug: "htc", href: "/sell-my/mobile/htc", image: "/images/brands/HTC_1.png", cardLabel: "Trade In Your HTC Mobile Phone" },
  { label: "LG", slug: "lg", href: "/sell-my/mobile/lg", image: "/images/brands/LG.png", cardLabel: "Trade In Your LG Mobile Phone" },
  { label: "Motorola", slug: "motorola", href: "/sell-my/mobile/motorola", image: "/images/brands/MOTOROLA.png", cardLabel: "Trade In Your Motorola Mobile Phone" },
  { label: "Nokia", slug: "nokia", href: "/sell-my/mobile/nokia", image: "/images/brands/NOKIA.png", cardLabel: "Trade In Your Nokia Mobile Phone" },
  { label: "Razer", slug: "razer", href: "/sell-my/mobile/razer", image: "/images/brands/RAZER.png", cardLabel: "Trade In Your Razer Mobile Phone" },
  { label: "Realme", slug: "realme", href: "/sell-my/mobile/realme", image: "/images/brands/REALME.png", cardLabel: "Trade In Your Realme Mobile Phone" },
  { label: "Redmi", slug: "redmi", href: "/sell-my/mobile/redmi", image: "/images/brands/REDMI.png", cardLabel: "Trade In Your Redmi Mobile Phone" },
  { label: "Sony", slug: "sony", href: "/sell-my/mobile/sony", image: "/images/brands/SONY.png", cardLabel: "Trade In Your Sony Mobile Phone" },
  { label: "Xiaomi", slug: "xiaomi", href: "/sell-my/mobile/xiaomi", image: "/images/brands/XIAOMI.png", cardLabel: "Trade In Your Xiaomi Mobile Phone" },
  { label: "ZTE", slug: "zte", href: "/sell-my/mobile/zte", image: "/images/brands/ZTE.png", cardLabel: "Trade In Your Zte Mobile Phone" },
  { label: "HMD", slug: "hmd", href: "/sell-my/mobile/hmd", cardLabel: "Trade in Your HMD Mobile Phone" },
  { label: "Nothing", slug: "nothing", href: "/sell-my/mobile/nothing", cardLabel: "Trade In Your Nothing Mobile Phone" },
];

const ORDER = new Map(MOBILE_BRANDS.map((b, i) => [b.slug, i]));
const META = new Map(MOBILE_BRANDS.map((b) => [b.slug, b]));

export function sortMobileBrands(brands: BrandItem[]): BrandItem[] {
  return [...brands].sort((a, b) => {
    const ia = ORDER.get(a.slug) ?? 999;
    const ib = ORDER.get(b.slug) ?? 999;
    if (ia !== ib) return ia - ib;
    return a.label.localeCompare(b.label);
  });
}

/** Merge Shopify brand data with 4gadgets labels and image paths. */
export function enrichMobileBrand(brand: BrandItem): BrandItem {
  const meta = META.get(brand.slug);
  if (!meta) return brand;

  return {
    ...brand,
    label: meta.label,
    href: brand.href || meta.href,
    cardLabel: brand.cardLabel || meta.cardLabel,
    image: meta.image ? resolveImageUrl(meta.image) : brand.image,
    heroImage: meta.heroImage ? resolveImageUrl(meta.heroImage) : brand.heroImage,
  };
}

export function normalizeMobileBrands(brands: BrandItem[]): BrandItem[] {
  return sortMobileBrands(brands.map(enrichMobileBrand));
}

export function getMobileBrandMeta(slug: string): BrandItem | undefined {
  return META.get(slug);
}
