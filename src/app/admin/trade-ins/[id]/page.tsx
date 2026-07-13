import { notFound, redirect } from "next/navigation";
import TradeInDetail from "@/components/admin/TradeInDetail";
import { getAdminSession } from "@/lib/admin/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getModelImageUrl } from "@/lib/trade-in/shopify-inventory";
import type { TradeInEvent, TradeInSubmission } from "@/lib/trade-in/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminTradeInDetailPage({ params }: Props) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const [{ data: submission, error }, { data: events, error: eventsError }] = await Promise.all([
    supabase.from("trade_in_submissions").select("*").eq("id", id).single(),
    supabase
      .from("trade_in_events")
      .select("*")
      .eq("submission_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (error || !submission) notFound();
  if (eventsError) {
    console.error("[admin/trade-ins/id] events failed:", eventsError);
  }

  const sub = submission as TradeInSubmission;
  // Default inspection photo = the catalogue model's image (best-effort).
  const modelImage = await getModelImageUrl(sub.product_slug).catch(() => null);

  return <TradeInDetail submission={sub} events={(events ?? []) as TradeInEvent[]} modelImage={modelImage} />;
}
