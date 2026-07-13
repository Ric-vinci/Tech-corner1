import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { countRefurbUnits } from "@/lib/shopify/admin-inventory";
import { PIPELINE_QUEUES } from "@/lib/admin/pipeline";
import { TRADE_IN_STATUS_LABELS, type TradeInStatus } from "@/lib/trade-in/status";
import { OPEN_STATUSES, statusBadgeClass, statusDotClass } from "@/lib/trade-in/status-ui";

export const metadata = { title: "Dashboard — 4gadgets Admin" };

const money = (v: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(v);

type Row = {
  id: string;
  status: TradeInStatus;
  product_name: string;
  customer_name: string | null;
  quoted_price: number;
  revised_price: number | null;
  created_at: string;
};

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const supabase = getSupabaseAdmin();
  const [{ data }, refurb] = await Promise.all([
    supabase
      .from("trade_in_submissions")
      .select("id,status,product_name,customer_name,quoted_price,revised_price,created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    countRefurbUnits().catch(() => ({ total: 0, live: 0 })),
  ]);

  const rows = (data ?? []) as Row[];
  const countBy = (statuses: TradeInStatus[]) => rows.filter((r) => statuses.includes(r.status)).length;
  const openRows = rows.filter((r) => OPEN_STATUSES.includes(r.status));
  const openValue = openRows.reduce((s, r) => s + Number(r.revised_price ?? r.quoted_price ?? 0), 0);
  const paidRows = rows.filter((r) => r.status === "paid");
  const paidValue = paidRows.reduce((s, r) => s + Number(r.revised_price ?? r.quoted_price ?? 0), 0);

  const kpis = [
    { label: "Total trade-ins", value: String(rows.length), hint: "all time" },
    { label: "Needs action", value: String(openRows.length), hint: money(openValue) + " in play" },
    { label: "Refurb units", value: String(refurb.total), hint: `${refurb.live} live on storefront` },
    { label: "Paid out", value: money(paidValue), hint: paidRows.length + " payouts" },
  ];

  const stages = [
    ...PIPELINE_QUEUES.map((q) => ({
      label: q.label,
      description: q.description,
      count: countBy(q.statuses),
      href: `/admin/trade-ins?queue=${q.slug}`,
    })),
    {
      label: "Ready for Sale",
      description: "Accepted units prepared and waiting to be published to Shopify.",
      count: Math.max(0, refurb.total - refurb.live),
      href: "/admin/inventory?status=draft",
    },
    {
      label: "Live on Store",
      description: "Refurbished units published to the storefront via the Storefront API.",
      count: refurb.live,
      href: "/admin/inventory?status=live",
    },
  ];

  const recent = rows.slice(0, 8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-grey-dark">Trade-in pipeline — from customer submission to published resale product.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-grey-light bg-pure-white p-5">
            <div className="text-sm text-grey-dark">{k.label}</div>
            <div className="mt-1 font-heading text-3xl font-semibold tracking-tight">{k.value}</div>
            <div className="mt-1 text-xs text-grey-dark">{k.hint}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold">Pipeline</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stages.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="group rounded-2xl border border-grey-light bg-pure-white p-5 transition hover:border-grey-dark hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-black">{s.label}</span>
                <span className="rounded-full bg-grey-lighter px-2.5 py-0.5 text-sm font-semibold tabular-nums">{s.count}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-grey-dark">{s.description}</p>
              <span className="mt-3 inline-block text-xs font-medium text-blue group-hover:underline">Open queue →</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold">Recent submissions</h2>
        <div className="overflow-hidden rounded-2xl border border-grey-light bg-pure-white">
          {recent.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-grey-dark">No trade-ins yet.</p>
          ) : (
            <table className="min-w-full text-sm">
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-b border-grey-light last:border-0">
                    <td className="px-5 py-3">
                      <Link href={`/admin/trade-ins/${r.id}`} className="font-medium text-black hover:underline">
                        {r.product_name}
                      </Link>
                      <div className="text-xs text-grey-dark">{r.customer_name ?? "—"}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(r.status)}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(r.status)}`} />
                        {TRADE_IN_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-grey-dark">
                      {money(Number(r.revised_price ?? r.quoted_price ?? 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
