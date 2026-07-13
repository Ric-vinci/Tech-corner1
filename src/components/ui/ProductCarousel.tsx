"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { Product } from "@/data/types";
import { ChevronLeft, ChevronRight, ArrowRight } from "@/components/ui/Icons";

type Props = {
  title: string;
  subtitle?: string;
  products: Product[];
  /** "buy" shows price as-is; "sell" styles the small square CTA button. */
  variant?: "buy" | "sell";
};

export default function ProductCarousel({ title, subtitle, products, variant = "buy" }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section className="mb-0">
      <div className="mb-6 flex flex-wrap items-center justify-between md:mb-8">
        <div className="mb-2 shrink-0">
          <h3 className="text-lg md:text-2xl">{title}</h3>
          {subtitle && <p className="mt-1 text-grey-dark md:text-lg">{subtitle}</p>}
        </div>
        <div className="hidden gap-2.5 md:flex">
          <button
            onClick={() => scroll(-1)}
            aria-label="Previous"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-grey-light text-grey-dark transition hover:border-black hover:text-black"
          >
            <ChevronLeft className="h-4 w-2.5" />
          </button>
          <button
            onClick={() => scroll(1)}
            aria-label="Next"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-grey-light text-grey-dark transition hover:border-black hover:text-black"
          >
            <ChevronRight className="h-4 w-2.5" />
          </button>
        </div>
      </div>

      <div ref={trackRef} className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-2 md:gap-5">
        {products.map((product) => (
          <div
            key={product.name}
            className="flex min-w-[65%] snap-start flex-col rounded-3xl bg-pure-white p-4 shadow-md sm:min-w-[45%] md:min-w-[calc(33.333%-14px)] lg:min-w-[calc(25%-15px)]"
          >
            <Link href={product.href} className="mb-4 block">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 65vw, 25vw"
                  className="object-contain p-3"
                />
              </div>
            </Link>
            <Link
              href={product.href}
              className="mb-2 line-clamp-2 min-h-[2.75rem] text-sm font-medium transition hover:text-mode-primary"
            >
              {product.name}
            </Link>
            <div className="mt-auto flex items-end justify-between">
              <span className={`font-heading font-semibold ${variant === "sell" ? "text-base" : "text-lg"}`}>
                {product.price}
              </span>
              {variant === "sell" ? (
                <Link
                  href={product.href}
                  aria-label={`Sell ${product.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-mode-primary text-pure-white transition hover:bg-mode-primary-darker"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link href={product.href} className="text-sm font-medium text-mode-primary hover:underline">
                  View &rarr;
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
