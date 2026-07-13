"use client";

import { useEffect, useRef, useState } from "react";

type SortKey = "position" | "name" | "low_to_high" | "high_to_low";

type Props = {
  from: number;
  to: number;
  total: number;
  perPage?: number;
  sort?: SortKey;
  showingAll?: boolean;
  onPerPageChange?: (perPage: number) => void;
  onSortChange?: (sort: SortKey) => void;
};

const SORT_LABELS: Record<SortKey, string> = {
  position: "Position",
  name: "Product Name",
  low_to_high: "Price Low to High",
  high_to_low: "Price High To Low",
};

export default function SellCatalogToolbar({
  from,
  to,
  total,
  perPage = 16,
  sort = "position",
  showingAll = false,
  onPerPageChange,
  onSortChange,
}: Props) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="toolbar-wrapper">
      <div className="toolbar toolbar-products flex flex-wrap items-center justify-end">
        <div className="field limiter flex items-center order-1 sm:order-1 md:order-1 lg:order-1 col-span-2 justify-end mr-4">
          <div className="control">
            <label className="text-sm mr-2 label">
              <span>Show</span>
              <select
                data-role="limiter"
                className="form-select limiter-options bg-white"
                value={perPage}
                onChange={(e) => onPerPageChange?.(Number(e.target.value))}
              >
                <option value="16">16</option>
                <option value="32">32</option>
                <option value="64">64</option>
                <option value="500">500</option>
              </select>
            </label>
          </div>
          <span className="limiter-text text-sm ml-2">Per Page</span>
        </div>

        <div className="toolbar-sorter sorter flex items-center order-2 col-span-3 sm:col-span-6 md:col-span-3 lg:col-span-6 justify-end">
          <span className="sr-only sorter-label">Sort By</span>
          <select
            data-role="sorter"
            className="form-select sorter-options bg-white hidden"
            value={sort}
            aria-label="Sort By"
            onChange={(e) => onSortChange?.(e.target.value as SortKey)}
          >
            <option value="position">Position</option>
            <option value="name">Product Name</option>
            <option value="low_to_high">Price Low to High</option>
            <option value="high_to_low">Price High To Low</option>
          </select>
          <div className={`custom-select sorter-options${sortOpen ? " active" : ""}`} ref={sortRef}>
            <div
              className="custom-select__display form-select bg-white"
              onClick={() => setSortOpen((open) => !open)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSortOpen((open) => !open);
              }}
            >
              <span className="custom-select__display__value">{SORT_LABELS[sort]}</span>
            </div>
            <ul className={`custom-select__options${sortOpen ? " active" : ""}`}>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <li
                  key={key}
                  value={key}
                  className={sort === key ? "selected" : ""}
                  onClick={() => {
                    onSortChange?.(key);
                    setSortOpen(false);
                  }}
                >
                  {SORT_LABELS[key]}
                </li>
              ))}
            </ul>
          </div>
          <a
            title="Set Descending Direction"
            href="#"
            className="action sorter-action sort-asc"
            onClick={(e) => e.preventDefault()}
          >
            <span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
            </span>
          </a>
        </div>

        <p className="toolbar-amount text-sm leading-5 text-gray-700 order-1 w-full" id="toolbar-amount">
          {showingAll ? (
            <>
              <span className="toolbar-number total-amount">{total}</span> Items
            </>
          ) : (
            <>
              Items <span className="toolbar-number">{from}</span>-<span className="toolbar-number">{to}</span> of{" "}
              <span className="toolbar-number total-amount">{total}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
