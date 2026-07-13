/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { BrandItem } from "@/data/types";

const cardClass =
  "bg-white px-4 pt-8 pb-6 text-center rounded-3xl shadow-sm flex flex-col items-center justify-center aspect-square transition border-2 border-transparent hover:border-mode-primary hover:text-mode-primary md:p-7 md:pt-10 md:text-lg";

export default function BrandGrid({ brands, variant = "default" }: { brands: BrandItem[]; variant?: "default" | "sell-mobile" }) {
  if (variant === "sell-mobile") {
    return (
      <div className="grid grid-cols-2 gap-2 font-heading font-medium mb-10 md:grid-cols-3 lg:grid-cols-4 md:gap-2.5 md:mb-14">
        {brands.map((brand) => (
          <Link key={brand.slug} href={brand.href} className={cardClass}>
            {brand.image && (
              <div className="flex items-center h-16 mb-5 md:mb-8 md:h-auto md:grow">
                <picture className="max-h-full">
                  <img className="max-h-full" src={brand.image} alt={brand.label} loading="lazy" />
                </picture>
              </div>
            )}
            {brand.cardLabel ?? `Trade In Your ${brand.label} Mobile Phone`}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {brands.map((brand) => (
        <Link
          key={brand.slug}
          href={brand.href}
          className="group flex flex-col items-center gap-3 rounded-2xl bg-pure-white p-5 text-center shadow-md transition hover:shadow-hover"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-grey-lighter text-lg font-semibold text-grey-dark group-hover:bg-mode-primary/10 group-hover:text-mode-primary">
            {brand.image ? (
              <img src={brand.image} alt={brand.label} className="h-12 w-12 object-contain" />
            ) : (
              brand.label.charAt(0)
            )}
          </div>
          <span className="text-sm font-medium transition group-hover:text-mode-primary">{brand.label}</span>
        </Link>
      ))}
    </div>
  );
}
