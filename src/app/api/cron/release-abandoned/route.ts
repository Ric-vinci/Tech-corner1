import { NextResponse } from "next/server";
import { releaseAbandonedBuyOrders } from "@/lib/buy-payment/abandoned";
import { requireAdminSession } from "@/lib/admin/session";

/**
 * Puts stock back from checkouts that were never paid for.
 *
 * Runs on a schedule (see vercel.json). It moves stock, so it is not public:
 * callers must present CRON_SECRET, or be a signed-in admin running it by hand
 * from the Orders screen. Vercel Cron sends the secret as a Bearer token.
 */
export const dynamic = "force-dynamic";

async function authorize(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get("authorization") ?? "";
    if (header === `Bearer ${secret}`) return true;
  }
  try {
    await requireAdminSession();
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  if (!(await authorize(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await releaseAbandonedBuyOrders();
  if (result.released.length) {
    console.warn(`[cron] released ${result.released.length} abandoned order(s):`, result.released.map((r) => r.id).join(", "));
  }
  return NextResponse.json(result);
}

export const POST = GET;
