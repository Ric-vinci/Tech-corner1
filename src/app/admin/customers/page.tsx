import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const metadata = { title: "Customers — 4gadgets Admin" };

type Customer = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
};

const formatDate = (v: string) => new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default async function AdminCustomersPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const supabase = getSupabaseAdmin();
  const [{ data: customers }, { data: subs }] = await Promise.all([
    supabase.from("customers").select("id,email,first_name,last_name,phone,created_at").order("created_at", { ascending: false }).limit(500),
    supabase.from("trade_in_submissions").select("customer_id,customer_email,quoted_price,revised_price"),
  ]);

  // Tally trade-ins per customer (by id, falling back to email).
  const tally = new Map<string, { count: number; value: number }>();
  for (const s of (subs ?? []) as { customer_id: string | null; customer_email: string | null; quoted_price: number; revised_price: number | null }[]) {
    const key = s.customer_id ?? s.customer_email ?? "";
    if (!key) continue;
    const cur = tally.get(key) ?? { count: 0, value: 0 };
    cur.count += 1;
    cur.value += Number(s.revised_price ?? s.quoted_price ?? 0);
    tally.set(key, cur);
  }

  const rows = (customers ?? []) as Customer[];
  const money = (v: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="mt-1 text-sm text-grey-dark">People who registered to trade in or buy. {rows.length} total.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-grey-light bg-pure-white">
        {rows.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-grey-dark">No customers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-grey-light bg-grey-lightest text-left text-xs uppercase tracking-wide text-grey-dark">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Phone</th>
                  <th className="px-3 py-3 text-right font-medium">Trade-ins</th>
                  <th className="px-3 py-3 text-right font-medium">Lifetime value</th>
                  <th className="px-5 py-3 text-right font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const t = tally.get(c.id) ?? tally.get(c.email) ?? { count: 0, value: 0 };
                  const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
                  return (
                    <tr key={c.id} className="border-b border-grey-light last:border-0">
                      <td className="px-5 py-4">
                        <div className="font-medium text-black">{name}</div>
                        <div className="text-xs text-grey-dark">{c.email}</div>
                      </td>
                      <td className="px-3 py-4 text-grey-dark">{c.phone ?? "—"}</td>
                      <td className="px-3 py-4 text-right tabular-nums">{t.count}</td>
                      <td className="px-3 py-4 text-right tabular-nums text-grey-dark">{money(t.value)}</td>
                      <td className="px-5 py-4 text-right text-grey-dark">{formatDate(c.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
