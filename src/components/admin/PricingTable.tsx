"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import Pagination from "@/components/admin/Pagination";
import type { PricingProduct } from "@/lib/shopify/admin-pricing";

type Field = "priceWorking" | "priceFaulty" | "priceNoPower";
type Draft = Record<string, Partial<Record<Field, string>>>;

type Props = {
  products: PricingProduct[];
  page: number;
  totalPages: number;
  search?: string;
  category?: string;
  bonus: number;
};

const FIELDS: { key: Field; label: string }[] = [
  { key: "priceWorking", label: "Working" },
  { key: "priceFaulty", label: "Faulty" },
  { key: "priceNoPower", label: "No power" },
];

const fmt = (value: number | null) => (value == null ? "" : String(value));

export default function PricingTable({ products, page, totalPages, search, category, bonus }: Props) {
  const [draft, setDraft] = useState<Draft>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [bulkWorking, setBulkWorking] = useState("");

  // Current value of a cell: the draft edit if present, else the saved value.
  function cellValue(product: PricingProduct, field: Field): string {
    const edited = draft[product.id]?.[field];
    return edited !== undefined ? edited : fmt(product[field]);
  }

  function isDirty(product: PricingProduct, field: Field): boolean {
    const edited = draft[product.id]?.[field];
    return edited !== undefined && edited !== fmt(product[field]);
  }

  function setCell(id: string, field: Field, value: string) {
    setDraft((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  const dirtyIds = useMemo(
    () => products.filter((p) => FIELDS.some((f) => isDirty(p, f.key))).map((p) => p.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft, products],
  );

  function applyBulkWorking() {
    if (bulkWorking.trim() === "") return;
    setDraft((prev) => {
      const next = { ...prev };
      for (const p of products) next[p.id] = { ...next[p.id], priceWorking: bulkWorking };
      return next;
    });
  }

  async function save() {
    const updates = dirtyIds.map((id) => {
      const d = draft[id] ?? {};
      return {
        productId: id,
        ...(d.priceWorking !== undefined ? { priceWorking: d.priceWorking } : {}),
        ...(d.priceFaulty !== undefined ? { priceFaulty: d.priceFaulty } : {}),
        ...(d.priceNoPower !== undefined ? { priceNoPower: d.priceNoPower } : {}),
      };
    });
    if (!updates.length) return;

    setSaving(true);
    setMessage(null);
    setFailed(false);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 207) throw new Error(data.error ?? "Save failed");
      if (data.failures?.length) {
        setFailed(true);
        setMessage(`Saved ${data.saved}, ${data.failures.length} failed.`);
      } else {
        setMessage(`Saved ${data.saved} product${data.saved === 1 ? "" : "s"}. Reloading…`);
        // Reload so the saved values become the new baseline.
        setTimeout(() => window.location.reload(), 700);
      }
    } catch (err) {
      setFailed(true);
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-20 rounded-md border px-2 py-1 text-sm text-right tabular-nums outline-none transition focus:border-black";

  return (
    <div className="space-y-4">
      <AdminFilterBar basePath="/admin/pricing" category={category} search={search} />

      {/* Bulk edit control */}
      <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-grey-light bg-pure-white p-4">
        <div>
          <label htmlFor="bulk-working" className="mb-1 block text-xs font-medium text-grey-dark">
            Set all &ldquo;Working&rdquo; on this page to
          </label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-grey-dark">£</span>
            <input
              id="bulk-working"
              value={bulkWorking}
              onChange={(e) => setBulkWorking(e.target.value.replace(/[^\d.]/g, ""))}
              className="h-9 w-24 rounded-lg border border-grey-light bg-grey-lightest px-2 text-sm outline-none focus:border-black focus:bg-pure-white"
              placeholder="15"
            />
            <button type="button" onClick={applyBulkWorking} className="h-9 rounded-lg border border-grey-light px-3 text-sm font-medium hover:border-grey-dark">
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-grey-light bg-pure-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-grey-light bg-grey-lightest text-left text-xs uppercase tracking-wide text-grey-dark">
                <th className="px-5 py-3 font-medium">Device</th>
                {FIELDS.map((f) => (
                  <th key={f.key} className="px-3 py-3 text-right font-medium">
                    {f.label} (£)
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-grey-dark">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-grey-light last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img src={product.image} alt="" className="h-9 w-9 shrink-0 rounded object-contain" />
                        ) : (
                          <div className="h-9 w-9 shrink-0 rounded bg-grey-lighter" />
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-medium text-black">{product.title}</div>
                          <div className="truncate font-mono text-xs text-grey-dark">{product.handle}</div>
                        </div>
                      </div>
                    </td>
                    {FIELDS.map((f) => (
                      <td key={f.key} className="px-3 py-3 text-right">
                        <input
                          value={cellValue(product, f.key)}
                          onChange={(e) => setCell(product.id, f.key, e.target.value.replace(/[^\d.]/g, ""))}
                          className={`${inputClass} ${
                            isDirty(product, f.key) ? "border-green bg-green-light" : "border-grey-light bg-grey-lightest"
                          }`}
                          inputMode="decimal"
                        />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer: bonus note + save */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-grey-dark">
          Store-credit bonus is currently a global <strong>£{bonus.toFixed(2)}</strong> (set via env). Prices write to
          Shopify <code>trade_in</code> metafields.
        </p>
        <div className="flex items-center gap-3">
          {message && <span className={`text-sm ${failed ? "text-red-600" : "text-green"}`}>{message}</span>}
          <button
            type="button"
            onClick={save}
            disabled={saving || dirtyIds.length === 0}
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-pure-white transition hover:bg-black-off disabled:opacity-50"
          >
            {saving ? "Saving…" : dirtyIds.length ? `Save ${dirtyIds.length} change${dirtyIds.length === 1 ? "" : "s"}` : "No changes"}
          </button>
        </div>
      </div>

      <Pagination
        basePath="/admin/pricing"
        page={page}
        totalPages={totalPages}
        params={{ category, q: search }}
      />
    </div>
  );
}
