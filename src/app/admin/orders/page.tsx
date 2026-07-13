import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import AdminOrdersTable, { type BuyOrderRow } from "@/components/admin/AdminOrdersTable";

export const metadata = { title: "Orders — 4gadgets Admin" };

export default async function AdminOrdersPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { data } = await getSupabaseAdmin()
    .from("buy_orders")
    .select("id,created_at,customer_email,total,status,payment_method,payment_status,items")
    .order("created_at", { ascending: false })
    .limit(300);

  const orders = ((data ?? []) as BuyOrderRow[]).map((o) => ({ ...o, total: Number(o.total), items: o.items ?? [] }));
  const awaitingCount = orders.filter((o) => o.payment_method === "bank" && o.payment_status !== "paid").length;

  return <AdminOrdersTable orders={orders} awaitingCount={awaitingCount} />;
}
