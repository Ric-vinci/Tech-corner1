"use client";

import { useState } from "react";
import { RefurbUnitRow, type RefurbRow } from "@/components/admin/RefurbInventoryTable";

type Props = {
  sizeGroups: [string, RefurbRow[]][];
  totalUnits: number;
  totalStock: number;
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

export default function RefurbModelDetail({ sizeGroups, totalUnits, totalStock, live: initialLive }: Props) {
  const [liveCount, setLiveCount] = useState(initialLive);
  const onToggled = (nowLive: boolean) => setLiveCount((c) => Math.max(0, c + (nowLive ? 1 : -1)));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Units" value={totalUnits} />
        <StatCard label="In stock" value={totalStock} />
        <StatCard label="Live on storefront" value={liveCount} />
      </div>

      {sizeGroups.map(([size, units]) => (
        <div key={size} className="overflow-hidden rounded-2xl border border-grey-light bg-pure-white">
          <div className="flex items-center gap-2 border-b border-grey-light bg-grey-lightest px-5 py-3">
            <span className="text-sm font-semibold text-black">{size}</span>
            <span className="text-xs text-grey-dark">· {units.length} unit{units.length === 1 ? "" : "s"}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-grey-light text-left text-xs uppercase tracking-wide text-grey-dark">
                  <th className="px-5 py-3 font-medium">Device</th>
                  <th className="px-3 py-3 font-medium">Grade</th>
                  <th className="px-3 py-3 text-right font-medium" title="Per-unit cost — what the device cost you">Cost</th>
                  <th className="px-3 py-3 text-right font-medium">Resale price</th>
                  <th className="px-3 py-3 text-center font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <RefurbUnitRow key={u.id} unit={u} onToggled={onToggled} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
