import { redirect } from "next/navigation";
import TradeInList, { type TradeInStats } from "@/components/admin/TradeInList";
import { getAdminSession } from "@/lib/admin/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isTradeInStatus } from "@/lib/trade-in/status";
import { OPEN_STATUSES } from "@/lib/trade-in/status-ui";
import { getPipelineQueue } from "@/lib/admin/pipeline";
import { isAdminCategory } from "@/lib/admin/categories";
import type { TradeInStatus } from "@/lib/trade-in/status";
import type { TradeInSubmission } from "@/lib/trade-in/types";

export const metadata = { title: "Trade-ins — 4gadgets Admin" };

type Props = {
  searchParams: Promise<{ status?: string; queue?: string; category?: string }>;
};

export default async function AdminTradeInsPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { status, queue: queueSlug, category } = await searchParams;
  const queue = getPipelineQueue(queueSlug);
  const activeCategory = isAdminCategory(category) ? category : undefined;
  const supabase = getSupabaseAdmin();

  // A queue is a group of statuses; an explicit status filter narrows within it.
  const buildQuery = (withCategory: boolean) => {
    let q = supabase
      .from("trade_in_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (status && isTradeInStatus(status)) q = q.eq("status", status);
    else if (queue) q = q.in("status", queue.statuses);
    if (withCategory && activeCategory) q = q.eq("category", activeCategory);
    return q;
  };

  const [listResult, { data: allRows }] = await Promise.all([
    buildQuery(Boolean(activeCategory)),
    supabase.from("trade_in_submissions").select("status,quoted_price,revised_price"),
  ]);

  let { data, error } = listResult;
  // The category column only exists after migration 007 — fall back gracefully.
  if (error && activeCategory) {
    ({ data, error } = await buildQuery(false));
  }
  if (error) console.error("[admin/trade-ins] load failed:", error.message ?? error);

  type StatRow = { status: TradeInStatus; quoted_price: number; revised_price: number | null };
  const rows = (allRows ?? []) as StatRow[];
  const isOpen = (value: TradeInStatus) => OPEN_STATUSES.includes(value);

  const stats: TradeInStats = {
    total: rows.length,
    needsAction: rows.filter((row) => isOpen(row.status)).length,
    accepted: rows.filter((row) => row.status === "accepted").length,
    paid: rows.filter((row) => row.status === "paid").length,
    openValue: rows
      .filter((row) => isOpen(row.status))
      .reduce((sum, row) => sum + Number(row.revised_price ?? row.quoted_price ?? 0), 0),
  };

  return (
    <TradeInList
      submissions={(data ?? []) as TradeInSubmission[]}
      stats={stats}
      activeStatus={status}
      activeCategory={activeCategory}
      queue={queue ? { slug: queue.slug, label: queue.label, description: queue.description, statuses: queue.statuses } : undefined}
    />
  );
}
