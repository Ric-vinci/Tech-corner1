/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import type { RefurbModelSummary } from "@/lib/shopify/admin-inventory";

type Props = {
  models: RefurbModelSummary[];
  category?: string;
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

export default function RefurbModelList({ models, category, search, total, live }: Props) {
  const money = (v: number | null) => (v == null ? "—" : `£${v.toFixed(2)}`);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Models" value={models.length} />
        <StatCard label={category ? "Units (filtered)" : "Units in stock"} value={total} />
        <StatCard label="Live on storefront" value={live} />
      </div>

      <AdminFilterBar basePath="/admin/inventory" category={category} search={search} />

      <div className="overflow-hidden rounded-2xl border border-grey-light bg-pure-white">
        {models.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="font-medium text-black">No refurb stock yet</p>
            <p className="mt-1 text-sm text-grey-dark">
              A model appears here once you accept a trade-in from{" "}
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
                  <th className="px-5 py-3 font-medium">Model</th>
                  <th className="px-3 py-3 font-medium">Sizes</th>
                  <th className="px-3 py-3 text-right font-medium">Units</th>
                  <th className="px-3 py-3 text-right font-medium">In stock</th>
                  <th className="px-3 py-3 text-right font-medium">From</th>
                  <th className="px-3 py-3 text-center font-medium">Live</th>
                  <th className="px-5 py-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.slug} className="border-b border-grey-light last:border-0 hover:bg-grey-lightest">
                    <td className="px-5 py-4">
                      <Link href={`/admin/inventory/model/${m.slug}`} className="flex items-center gap-3">
                        {m.image ? (
                          <img src={m.image} alt="" className="h-10 w-10 shrink-0 rounded object-contain" />
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded bg-grey-lighter" />
                        )}
                        <span className="font-medium text-black hover:underline">{m.modelName}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-1">
                        {m.sizes.length ? (
                          m.sizes.map((s) => (
                            <span key={s} className="rounded-full bg-grey-lighter px-2 py-0.5 text-xs text-grey-dark">{s}</span>
                          ))
                        ) : (
                          <span className="text-grey-dark">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right tabular-nums text-grey-dark">{m.unitCount}</td>
                    <td className="px-3 py-4 text-right">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${m.totalStock > 0 ? "bg-green-light text-green" : "bg-grey-lighter text-grey-dark"}`}>
                        {m.totalStock}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right tabular-nums">{money(m.fromPrice)}</td>
                    <td className="px-3 py-4 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${m.liveCount > 0 ? "bg-green-light text-green" : "bg-grey-lighter text-grey-dark"}`}>
                        {m.liveCount}/{m.unitCount}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/admin/inventory/model/${m.slug}`} className="text-sm font-medium text-blue hover:underline">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
