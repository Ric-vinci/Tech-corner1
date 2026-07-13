"use client";

/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { useMemo, useState } from "react";
import type { BuyProductDetail } from "@/lib/buy/product";
import { addToBuyCart } from "@/lib/cart/buy-cart";

const money = (v: number) => `£${v.toFixed(2)}`;

export default function BuyProductDetailView({ detail }: { detail: BuyProductDetail }) {
  const { units, colourOptions, storageOptions, gradeOptions, gradePrices } = detail;

  const has = (key: "colour" | "storage" | "grade", value: string) =>
    units.some((u) => (u[key] ?? "").toLowerCase() === value.toLowerCase());

  const first = units[0];
  const [colour, setColour] = useState<string | null>(first?.colour ?? colourOptions[0]?.label ?? null);
  const [storage, setStorage] = useState<string | null>(first?.storage ?? storageOptions[0] ?? null);
  const [grade, setGrade] = useState<string | null>(first?.grade ?? null);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const selectedUnit = useMemo(
    () =>
      units.find(
        (u) =>
          (u.colour ?? "").toLowerCase() === (colour ?? "").toLowerCase() &&
          (u.storage ?? "").toLowerCase() === (storage ?? "").toLowerCase() &&
          (u.grade ?? "").toLowerCase() === (grade ?? "").toLowerCase(),
      ),
    [units, colour, storage, grade],
  );

  const price = selectedUnit?.price ?? (grade ? gradePrices[grade] : detail.fromPrice) ?? detail.fromPrice;
  const gallery = [detail.image, "/images/pdp/box.png", "/images/pdp/cable.png"];

  function addToBasket() {
    if (!selectedUnit) return;
    addToBuyCart({
      id: selectedUnit.variantId ?? selectedUnit.productId,
      productName: `${detail.modelName}${storage ? ` ${storage}` : ""}${colour ? ` ${colour}` : ""}`,
      href: `/buy-used/${detail.handle}.html`,
      image: detail.image,
      colour,
      storage,
      grade,
      price: selectedUnit.price,
      variantId: selectedUnit.variantId,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  // Three states: selected (blue border), available (white), unavailable (grey).
  const optClass = (available: boolean, selected: boolean) =>
    [
      "rounded-lg border px-4 py-3 text-sm transition",
      selected
        ? "border-blue text-blue bg-pure-white"
        : available
          ? "border-grey-light bg-pure-white text-black hover:border-grey-dark"
          : "border-grey-light bg-grey-lighter text-grey-dark",
    ].join(" ");

  return (
    <>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-3">
            {gallery.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveImg(i)}
                className={`relative h-16 w-16 overflow-hidden rounded-xl border bg-pure-white ${i === activeImg ? "border-blue" : "border-grey-light"}`}
              >
                <img src={src} alt="" className="h-full w-full object-contain p-1.5" />
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-pure-white">
              <Image src={gallery[activeImg]} alt={detail.modelName} fill className="object-contain p-6" sizes="(max-width:1024px) 100vw, 40vw" />
            </div>
            <button type="button" onClick={() => setActiveImg((i) => (i - 1 + gallery.length) % gallery.length)} aria-label="Previous" className="absolute left-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-grey-dark hover:text-black">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" onClick={() => setActiveImg((i) => (i + 1) % gallery.length)} aria-label="Next" className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-grey-dark hover:text-black">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">{detail.modelName}</h1>
              <p className="mt-1 text-sm text-blue">
                {[colour, grade, storage].filter(Boolean).join(" - ")}
              </p>
            </div>
            <span className="shrink-0 font-heading text-xl font-semibold md:text-2xl">
              {price != null ? money(price) : "—"}
            </span>
          </div>

          {/* Payment tiles + Add to Basket */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <PayTile img="/images/pdp/klarna-badge.png" text="Pay in full, 30 days or 3 month instalments with 0% financing" />
            <PayTile img="/images/pdp/tradein.png" text="Trade in your old tech and save even more" />
            <PayTile img="/images/pdp/clearpay_badge.png" text="Pay in 4 interest-free payments" />
            <button
              type="button"
              onClick={addToBasket}
              disabled={!selectedUnit}
              className="flex items-center justify-center rounded-xl bg-blue px-6 py-3 text-sm font-semibold text-pure-white transition hover:bg-blue/90 disabled:cursor-not-allowed disabled:bg-grey-light disabled:text-grey-dark"
            >
              {added ? "Added ✓" : selectedUnit ? "Add to Basket" : "Out of stock"}
            </button>
          </div>

          {/* Product options */}
          <div className="mt-6 flex items-center gap-1.5">
            <h2 className="text-lg font-semibold">Product Options</h2>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue text-[10px] font-bold text-pure-white">?</span>
          </div>

          <OptionGroup label="Colour">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {colourOptions.map((c) => (
                <button key={c.label} type="button" onClick={() => setColour(c.label)} className={`${optClass(has("colour", c.label), colour?.toLowerCase() === c.label.toLowerCase())} flex items-center gap-2 text-left`}>
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </OptionGroup>

          <OptionGroup label="Storage">
            <div className="flex flex-wrap gap-3">
              {storageOptions.map((s) => (
                <button key={s} type="button" onClick={() => setStorage(s)} className={`${optClass(has("storage", s), storage?.toLowerCase() === s.toLowerCase())} min-w-[110px] text-center`}>
                  {s}
                </button>
              ))}
            </div>
          </OptionGroup>

          <OptionGroup label="Grade" info>
            <div className="grid grid-cols-4 gap-3">
              {gradeOptions.map((g) => (
                <button key={g} type="button" onClick={() => setGrade(g)} className={`${optClass(has("grade", g), grade?.toLowerCase() === g.toLowerCase())} flex flex-col items-center gap-0.5`}>
                  <span className="font-medium">{g}</span>
                  <span className={`text-xs ${grade?.toLowerCase() === g.toLowerCase() ? "text-blue" : "text-grey-dark"}`}>{money(gradePrices[g])}</span>
                </button>
              ))}
            </div>
          </OptionGroup>
        </div>
      </div>

      {/* Specifications */}
      <Collapsible title="Specifications" defaultOpen>
        <dl className="grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
          <SpecRow label="SKU" value={detail.sku} />
          <SpecRow label="Selfie Camera" value="32 MP" />
          <SpecRow label="Rear Camera" value="50 MP (Wide) | 12 MP (Ultrawide) | 5 MP (Macro)" />
          <SpecRow label="Warranty" value="12 months" />
        </dl>
      </Collapsible>

      <Collapsible title="Full Description">
        <p className="text-sm leading-7 text-grey-dark">
          The {detail.modelName} is a fully tested, certified refurbished device. Every unit is inspected and graded,
          then covered by a 12-month warranty with free next-day delivery on orders placed before 3pm. Choose your
          colour, storage and grade above — the price updates to match the exact device you select.
        </p>
      </Collapsible>
    </>
  );
}

function OptionGroup({ label, info, children }: { label: string; info?: boolean; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-medium">
        {label}
        {info && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue text-[10px] font-bold text-pure-white">?</span>}
      </div>
      {children}
    </div>
  );
}

function PayTile({ img, text }: { img: string; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-grey-light bg-pure-white px-3 py-2">
      <img src={img} alt="" className="h-5 w-auto shrink-0 object-contain" />
      <span className="text-[11px] leading-tight text-grey-dark">{text}</span>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-grey-light py-2">
      <dt className="text-sm text-grey-dark">{label}</dt>
      <dd className="text-right text-sm font-medium text-black">{value}</dd>
    </div>
  );
}

function Collapsible({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <section className="mt-10 border-t border-grey-light pt-6">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-2xl leading-none text-grey-dark">{open ? "×" : "+"}</span>
      </button>
      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}
