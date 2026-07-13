import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@/data/types";
import { ArrowRight, CartIcon } from "@/components/ui/Icons";

type Props = {
  products: CatalogProduct[];
  variant?: "buy" | "sell";
  /** Override the grid wrapper class (e.g. a 3-col layout inside a sidebar page). */
  gridClassName?: string;
};

export default function ProductGrid({ products, variant = "buy", gridClassName = "catalog-products" }: Props) {
  if (!products.length) {
    return (
      <p className="rounded-2xl bg-grey-lighter px-6 py-12 text-center text-grey-dark">
        No products found in this category yet.
      </p>
    );
  }

  return (
    <div className={gridClassName}>
      {products.map((product) => (
        <article
          key={product.href}
          className="flex flex-col rounded-2xl bg-pure-white p-4 shadow-md transition hover:shadow-hover"
        >
          <Link href={product.href} className="mb-3 block">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-contain p-2"
              />
            </div>
          </Link>
          <Link
            href={product.href}
            className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium transition hover:text-mode-primary"
          >
            {product.name}
          </Link>
          {variant === "buy" && !product.inStock ? (
            <div className="mt-auto">
              <div className="mb-2 flex items-end justify-between">
                <span className="font-heading text-sm font-semibold md:text-base">{product.price}</span>
              </div>
              <Link
                href={product.href}
                title="Notify when in stock"
                className="flex items-center justify-center gap-1.5 rounded-lg border border-grey-light px-3 py-2 text-xs font-medium text-grey-dark transition hover:border-grey-dark hover:text-black"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notify when in stock
              </Link>
            </div>
          ) : (
            <div className="mt-auto flex items-end justify-between gap-2">
              <span className="font-heading text-sm font-semibold md:text-base">{product.price}</span>
              {variant === "sell" ? (
                <Link
                  href={product.href}
                  aria-label={`Sell ${product.name}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-mode-primary text-pure-white transition hover:bg-mode-primary-darker"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href={product.href}
                  aria-label={`Buy ${product.name}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-mode-primary text-pure-white transition hover:bg-mode-primary-darker"
                >
                  <CartIcon className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
