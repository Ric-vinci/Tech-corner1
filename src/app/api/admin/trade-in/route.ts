import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { TradeInStatus } from "@/lib/trade-in/status";
import { isTradeInStatus } from "@/lib/trade-in/status";

export async function GET(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("trade_in_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && isTradeInStatus(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[admin/trade-in] list failed:", error);
    return NextResponse.json({ error: "Failed to load submissions" }, { status: 500 });
  }

  return NextResponse.json({ submissions: data ?? [] });
}
