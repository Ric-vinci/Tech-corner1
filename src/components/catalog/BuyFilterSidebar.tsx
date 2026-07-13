"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ModelFilterLink } from "@/data/types";

type Props = {
  basePath: string;
  modelLinks: ModelFilterLink[];
  activeModel?: string;
  priceBounds: { min: number; max: number };
  priceMin?: number;
  priceMax?: number;
  colourOptions: { label: string; hex: string }[];
  gradeOptions: string[];
  storageOptions: string[];
  selectedColours: string[];
  selectedGrades: string[];
  selectedStorages: string[];
};

function FilterGroup({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="filter-option border-t border-grey-light py-4">
      <button type="button" onClick={() => setOpen((o) => !o)} className="filter-options-title flex w-full items-center justify-between text-left">
        <span className="title text-md font-semibold md:text-lg">{title}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={`transition-transform ${open ? "" : "-rotate-90"}`}>
          <path d="M19 9L12 16L5 9" stroke="#4A5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="filter-options-content pt-3">{children}</div>}
    </div>
  );
}

export default function BuyFilterSidebar({
  basePath,
  modelLinks,
  activeModel,
  priceBounds,
  priceMin,
  priceMax,
  colourOptions,
  gradeOptions,
  storageOptions,
  selectedColours,
  selectedGrades,
  selectedStorages,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [min, setMin] = useState(priceMin ?? priceBounds.min);
  const [max, setMax] = useState(priceMax ?? priceBounds.max);

  const priceActive = priceMin != null || priceMax != null;
  const anyActive = priceActive || selectedColours.length || selectedGrades.length || selectedStorages.length || activeModel;

  function pushParams(mutate: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("p"); // reset to page 1 on any filter change
    mutate(p);
    const qs = p.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  }

  // Toggle one value in a comma-list param (colour / grade / storage).
  const toggle = (key: string, value: string, selected: string[]) =>
    pushParams((p) => {
      const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
      if (next.length) p.set(key, next.join(","));
      else p.delete(key);
    });

  const applyPrice = () => pushParams((p) => { p.set("price_min", String(min)); p.set("price_max", String(max)); });

  return (
    <div className="sidebar sidebar-main">
      <div className="block filter mt-2 md:mt-5">
        <div className="block-title mb-2 flex h-10 items-center">
          <span className="text-primary text-xl font-semibold uppercase md:text-2xl">Shop By</span>
        </div>

        {/* Active filtering */}
        <div className="filter-current rounded-lg border border-grey-light bg-grey-lightest p-4">
          <div className="mb-2 flex items-center justify-between">
            <strong className="text-sm">Active filtering</strong>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {priceActive && (
              <Chip label={`£${(priceMin ?? priceBounds.min).toFixed(0)} – £${(priceMax ?? priceBounds.max).toFixed(0)}`} onRemove={() => pushParams((p) => { p.delete("price_min"); p.delete("price_max"); })} />
            )}
            {selectedColours.map((c) => <Chip key={c} label={c} onRemove={() => toggle("colour", c, selectedColours)} />)}
            {selectedGrades.map((g) => <Chip key={g} label={g} onRemove={() => toggle("grade", g, selectedGrades)} />)}
            {selectedStorages.map((s) => <Chip key={s} label={s} onRemove={() => toggle("storage", s, selectedStorages)} />)}
            {!anyActive && <span className="text-grey-dark">No filters applied.</span>}
          </div>
          {anyActive ? (
            <Link href={basePath} className="mt-2 inline-block text-sm text-mode-primary hover:underline">Clear All</Link>
          ) : null}
        </div>

        {/* Model */}
        <FilterGroup title="Model">
          <div className="flex flex-col gap-1">
            {modelLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`py-1 text-sm hover:text-black ${activeModel && link.href.includes(`model=${activeModel}`) ? "font-semibold text-mode-primary" : "text-mode-primary/90"}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </FilterGroup>

        {/* Price */}
        <FilterGroup title="Price">
          <input type="range" min={priceBounds.min} max={priceBounds.max} value={max} onChange={(e) => setMax(Number(e.target.value))} onMouseUp={applyPrice} onTouchEnd={applyPrice} className="mb-3 w-full accent-mode-primary" />
          <div className="flex items-center gap-2">
            <input type="number" value={min} min={priceBounds.min} onChange={(e) => setMin(Number(e.target.value))} className="w-20 rounded-md border border-grey-light px-2 py-1 text-sm" aria-label="Min price" />
            <span className="text-grey-dark">–</span>
            <input type="number" value={max} max={priceBounds.max} onChange={(e) => setMax(Number(e.target.value))} className="w-20 rounded-md border border-grey-light px-2 py-1 text-sm" aria-label="Max price" />
            <button type="button" onClick={applyPrice} className="ml-auto rounded-md bg-black px-3 py-1 text-xs font-medium text-pure-white hover:bg-black-off">Go</button>
          </div>
        </FilterGroup>

        {/* Colour */}
        <FilterGroup title="Colour">
          <div className="grid grid-cols-5 gap-2">
            {colourOptions.map((c) => {
              const on = selectedColours.includes(c.label);
              return (
                <button
                  key={c.label}
                  type="button"
                  title={c.label}
                  aria-label={c.label}
                  aria-pressed={on}
                  onClick={() => toggle("colour", c.label, selectedColours)}
                  className={`relative h-7 w-7 rounded-full border transition ${on ? "border-black ring-2 ring-black ring-offset-1" : "border-grey-light hover:border-grey-dark"}`}
                  style={{ backgroundColor: c.hex }}
                >
                  {on && (
                    <svg viewBox="0 0 20 20" fill="none" className="absolute inset-0 m-auto h-4 w-4 text-pure-white mix-blend-difference">
                      <path d="m5 10 3 3 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </FilterGroup>

        {/* Grade */}
        <FilterGroup title="Grade">
          <div className="flex flex-col gap-1.5">
            {gradeOptions.map((g) => (
              <label key={g} className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={selectedGrades.includes(g)} onChange={() => toggle("grade", g, selectedGrades)} className="h-4 w-4 rounded border-grey-light accent-mode-primary" />
                <span>{g}</span>
              </label>
            ))}
          </div>
        </FilterGroup>

        {/* Storage */}
        <FilterGroup title="Storage">
          <div className="flex flex-col gap-1.5">
            {storageOptions.map((s) => (
              <label key={s} className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={selectedStorages.includes(s)} onChange={() => toggle("storage", s, selectedStorages)} className="h-4 w-4 rounded border-grey-light accent-mode-primary" />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </FilterGroup>
      </div>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-pure-white px-2 py-1 ring-1 ring-grey-light">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} className="text-grey-dark hover:text-black">
        <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </button>
    </span>
  );
}
