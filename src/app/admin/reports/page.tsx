import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { TRADE_IN_STATUS_LABELS, TRADE_IN_STATUSES, type TradeInStatus } from "@/lib/trade-in/status";
import { statusDotClass } from "@/lib/trade-in/status-ui";

export const metadata = { title: "Reports — 4gadgets Admin" };

const money = (v: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(v);

type Row = { status: TradeInStatus; payment_method: string | null; quoted_price: number; revised_price: number | null; created_at: string };

export default async function AdminReportsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("trade_in_submissions").select("status,payment_method,quoted_price,revised_price,created_at");
  const rows = (data ?? []) as Row[];
  const value = (r: Row) => Number(r.revised_price ?? r.quoted_price ?? 0);

  const byStatus = TRADE_IN_STATUSES.map((s) => ({ status: s, count: rows.filter((r) => r.status === s).length }));
  const paid = rows.filter((r) => r.status === "paid");
  const accepted = rows.filter((r) => r.status === "accepted" || r.status === "paid");
  const rejected = rows.filter((r) => r.status === "rejected");
  const decided = accepted.length + rejected.length;
  const acceptRate = decided ? Math.round((accepted.length / decided) * 100) : 0;

  // Payment method split (of paid).
  const methods = new Map<string, number>();
  for (const r of paid) methods.set(r.payment_method ?? "unknown", (methods.get(r.payment_method ?? "unknown") ?? 0) + 1);

  // Last 6 months volume.
  const months: { label: string; count: number; value: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-GB", { month: "short" });
    const inMonth = rows.filter((r) => {
      const rd = new Date(r.created_at);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
    });
    months.push({ label, count: inMonth.length, value: inMonth.reduce((s, r) => s + value(r), 0) });
  }
  const maxMonth = Math.max(1, ...months.map((m) => m.count));

  const kpis = [
    { label: "Total submissions", value: String(rows.length) },
    { label: "Accept rate", value: `${acceptRate}%`, hint: `${accepted.length} accepted / ${rejected.length} rejected` },
    { label: "Paid out", value: money(paid.reduce((s, r) => s + value(r), 0)), hint: `${paid.length} payouts` },
    { label: "Avg. accepted quote", value: money(accepted.length ? accepted.reduce((s, r) => s + value(r), 0) / accepted.length : 0) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-grey-dark">Trade-in performance across the whole pipeline.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-grey-light bg-pure-white p-5">
            <div className="text-sm text-grey-dark">{k.label}</div>
            <div className="mt-1 font-heading text-3xl font-semibold tracking-tight">{k.value}</div>
            {k.hint && <div className="mt-1 text-xs text-grey-dark">{k.hint}</div>}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-grey-light bg-pure-white p-5">
          <h2 className="mb-4 font-heading text-lg font-semibold">Submissions — last 6 months</h2>
          <div className="flex items-end gap-3">
            {months.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-32 w-full items-end">
                  <div
                    className="w-full rounded-t bg-blue/80"
                    style={{ height: `${(m.count / maxMonth) * 100}%` }}
                    title={`${m.count} submissions · ${money(m.value)}`}
                  />
                </div>
                <div className="text-xs text-grey-dark">{m.label}</div>
                <div className="text-xs font-medium tabular-nums">{m.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-grey-light bg-pure-white p-5">
          <h2 className="mb-4 font-heading text-lg font-semibold">By status</h2>
          <div className="space-y-2">
            {byStatus.filter((s) => s.count > 0).map((s) => (
              <div key={s.status} className="flex items-center gap-3 text-sm">
                <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(s.status)}`} />
                <span className="w-40 shrink-0 text-grey-dark">{TRADE_IN_STATUS_LABELS[s.status]}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-grey-lighter">
                  <div className="h-full rounded-full bg-black/70" style={{ width: `${(s.count / rows.length) * 100}%` }} />
                </div>
                <span className="w-8 text-right tabular-nums">{s.count}</span>
              </div>
            ))}
            {rows.length === 0 && <p className="text-sm text-grey-dark">No data yet.</p>}
          </div>

          {methods.size > 0 && (
            <>
              <h3 className="mb-2 mt-6 text-sm font-semibold">Payout methods</h3>
              <div className="flex flex-wrap gap-2">
                {[...methods.entries()].map(([m, c]) => (
                  <span key={m} className="rounded-full bg-grey-lighter px-3 py-1 text-xs font-medium capitalize text-grey-dark">
                    {m.replace(/_/g, " ")}: {c}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
