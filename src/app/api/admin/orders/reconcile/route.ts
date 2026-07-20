import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/session";
import { reconcileBuyOrders } from "@/lib/buy-payment/reconcile";

/** Read-only check that paid/refunded orders agree with Shopify stock. */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await reconcileBuyOrders());
}
