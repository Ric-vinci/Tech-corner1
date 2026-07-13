"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import Pagination from "@/components/admin/Pagination";
import type { RefurbUnit } from "@/lib/shopify/admin-inventory";

export type RefurbRow = RefurbUnit & {
  condition: string | null;
  cost: number | null;
  submissionId: string | null;
  /** How many ACTIVE units of this model are in stock (across all units). */
  modelStock?: number;
};

type Props = {
  rows: RefurbRow[];
  page: number;
  totalPages: number;
  category?: string;
  status?: string;
  search?: string;
  total: number;
  live: number;
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-grey-light bg-pure-white p-5">
      <div className="text-sm text-grey-dark">{label}</div>
      <div className="mt-1 font-heading text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

const money = (value: number | null) => (value == null ? "—" : `£${value.toFixed(2)}`);

function Row({ unit, onToggled }: { unit: RefurbRow; onToggled: (nowLive: boolean) => void }) {
  const [price, setPrice] = useState(unit.price != null ? String(unit.price) : "");
  const [live, setLive] = useState(unit.live);
  const [busy, setBusy] = useState<null | "price" | "publish">(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const priceDirty = price !== "" && Number(price) !== unit.price;

  async function patch(payload: Record<string, unknown>, kind: "price" | "publish") {
    setBusy(kind);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/inventory/${encodeURIComponent(unit.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function savePrice() {
    if (!unit.variantId) return;
    const ok = await patch({ variantId: unit.variantId, price: Number(price) }, "price");
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function togglePublish() {
    const next = !live;
    const ok = await patch({ live: next }, "publish");
    if (ok) {
      setLive(next);
      onToggled(next); // keep the Live/Draft stat cards in sync without a refresh
    }
  }

  const margin = unit.cost != null && price !== "" ? Number(price) - unit.cost : null;

  return (
    <tr className="border-b border-grey-light last:border-0 align-top">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {unit.image ? (
            <img src={unit.image} alt="" className="h-10 w-10 shrink-0 rounded object-contain" />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded bg-grey-lighter" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium text-black">{unit.title}</span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  (unit.modelStock ?? 0) > 0 ? "bg-green-light text-green" : "bg-grey-lighter text-grey-dark"
                }`}
                title="Units of this model currently in stock (live on the storefront)"
              >
                {unit.modelStock ?? 0} in stock
              </span>
            </div>
            <div className="truncate font-mono text-xs text-grey-dark">{unit.sku ?? unit.handle}</div>
          </div>
        </div>
      </td>

      <td className="px-3 py-4">
        <span className="rounded-full bg-grey-lighter px-2 py-1 text-xs font-medium text-grey-dark">
          {unit.condition ?? "—"}
        </span>
      </td>

      <td className="px-3 py-4 text-right tabular-nums text-grey-dark">{money(unit.cost)}</td>

      <td className="px-3 py-4">
        <div className="flex items-center justify-end gap-1">
          <span className="text-sm text-grey-dark">£</span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
            className={`w-20 rounded-md border px-2 py-1 text-right text-sm tabular-nums outline-none transition focus:border-black ${
              priceDirty ? "border-green bg-green-light" : "border-grey-light bg-grey-lightest"
            }`}
            inputMode="decimal"
          />
          <button
            type="button"
            onClick={savePrice}
            disabled={!priceDirty || busy !== null}
            className="rounded-md border border-grey-light px-2 py-1 text-xs font-medium hover:border-grey-dark disabled:opacity-40"
          >
            {busy === "price" ? "…" : saved ? "✓" : "Save"}
          </button>
        </div>
        {margin != null && (
          <div className={`mt-1 text-right text-xs ${margin >= 0 ? "text-green" : "text-red-600"}`}>
            {margin >= 0 ? "+" : ""}
            {money(margin)} margin
          </div>
        )}
      </td>

      <td className="px-3 py-4 text-center">
        <span
          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
            live ? "bg-green-light text-green" : "bg-grey-lighter text-grey-dark"
          }`}
        >
          {live ? "Live" : "Draft"}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={togglePublish}
            disabled={busy !== null}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
              live
                ? "border border-grey-light bg-pure-white text-grey-dark hover:border-grey-dark hover:text-black"
                : "bg-black text-pure-white hover:bg-black-off"
            }`}
          >
            {busy === "publish" ? "Working…" : live ? "Unpublish" : "Publish to storefront"}
          </button>
          {unit.submissionId && (
            <Link href={`/admin/trade-ins/${unit.submissionId}`} className="text-xs text-grey-dark hover:text-black hover:underline">
              View trade-in →
            </Link>
          )}
          {error && <span className="max-w-[180px] text-right text-xs text-red-600">{error}</span>}
        </div>
      </td>
    </tr>
  );
}

export default function RefurbInventoryTable({
  rows,
  page,
  totalPages,
  category,
  status,
  search,
  total,
  live: initialLive,
}: Props) {
  // Live count is tracked client-side so publishing/unpublishing updates the stat
  // cards instantly, without waiting for a page refresh.
  const [liveCount, setLiveCount] = useState(initialLive);
  const onToggled = (nowLive: boolean) => setLiveCount((c) => Math.max(0, c + (nowLive ? 1 : -1)));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={category ? "Units (filtered)" : "Units in stock"} value={total} />
        <StatCard label="Live on storefront" value={liveCount} />
        <StatCard label="Draft (not listed)" value={Math.max(0, total - liveCount)} />
      </div>

      <AdminFilterBar basePath="/admin/inventory" category={category} status={status} search={search} showStatus />

      <div className="overflow-hidden rounded-2xl border border-grey-light bg-pure-white">
        {rows.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="font-medium text-black">No refurb stock yet</p>
            <p className="mt-1 text-sm text-grey-dark">
              A unit appears here each time you accept a trade-in. Accept one from{" "}
              <Link href="/admin/trade-ins" className="text-blue hover:underline">
                Trade-ins
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-grey-light bg-grey-lightest text-left text-xs uppercase tracking-wide text-grey-dark">
                  <th className="px-5 py-3 font-medium">Device</th>
                  <th className="px-3 py-3 font-medium">Grade</th>
                  <th className="px-3 py-3 text-right font-medium" title="What the device cost you — the trade-in quote">
                    Cost
                  </th>
                  <th className="px-3 py-3 text-right font-medium">Resale price</th>
                  <th className="px-3 py-3 text-center font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((unit) => (
                  <Row key={unit.id} unit={unit} onToggled={onToggled} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        basePath="/admin/inventory"
        page={page}
        totalPages={totalPages}
        params={{ category, status, q: search }}
      />
    </div>
  );
}
