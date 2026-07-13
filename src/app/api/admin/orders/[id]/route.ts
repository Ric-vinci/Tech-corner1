import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

/** Admin action on a buy order — currently: confirm a bank transfer as received. */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action !== "mark_paid") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: order, error: loadError } = await supabase
    .from("buy_orders")
    .select("id, payment_method, payment_status")
    .eq("id", id)
    .single();
  if (loadError || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.payment_status === "paid") return NextResponse.json({ error: "Already marked paid." }, { status: 400 });

  const { data, error } = await supabase
    .from("buy_orders")
    .update({ payment_status: "paid", status: "paid", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("[admin/orders] mark paid failed:", error);
    return NextResponse.json({ error: "Could not update the order." }, { status: 500 });
  }
  return NextResponse.json({ order: data });
}
