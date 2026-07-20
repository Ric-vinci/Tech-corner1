import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { releaseStockOnce } from "@/lib/buy-payment/stock";
import { unitsForOrder } from "@/lib/buy-payment/units";

/**
 * Put stock back from orders that were never paid for.
 *
 * A device leaves stock the moment an order is created, so an abandoned
 * checkout (customer closes the PayPal tab, bank transfer never arrives) would
 * otherwise keep a phone reserved forever — invisible to other buyers while it
 * sits on the shelf.
 *
 * Deliberately conservative: only orders still 'pending' are touched, never one
 * that reached 'paid' or 'capturing', and the windows are generous so a slow
 * payer isn't cancelled mid-checkout. Bank transfers get days, not minutes,
 * because they legitimately take that long to land.
 */
const PAYPAL_WINDOW_MINUTES = Number(process.env.BUY_PAYPAL_ABANDON_MINUTES ?? 60);
const BANK_WINDOW_HOURS = Number(process.env.BUY_BANK_ABANDON_HOURS ?? 24 * 5);

export type SweepResult = {
  released: { id: string; method: string | null; total: number | null }[];
  scanned: number;
};

export async function releaseAbandonedBuyOrders(): Promise<SweepResult> {
  const supabase = getSupabaseAdmin();
  const now = Date.now();
  const paypalCutoff = new Date(now - PAYPAL_WINDOW_MINUTES * 60_000).toISOString();
  const bankCutoff = new Date(now - BANK_WINDOW_HOURS * 3_600_000).toISOString();
  const oldestCutoff = paypalCutoff > bankCutoff ? paypalCutoff : bankCutoff;

  const { data, error } = await supabase
    .from("buy_orders")
    .select("id, payment_method, payment_status, total, created_at, stock_taken, stock_released")
    .eq("payment_status", "pending")
    .eq("stock_taken", true)
    .eq("stock_released", false)
    .lt("created_at", oldestCutoff)
    .limit(200);

  if (error) {
    console.error("[abandoned] scan failed:", error);
    return { released: [], scanned: 0 };
  }

  const candidates = (data ?? []).filter((o) => {
    const cutoff = o.payment_method === "bank" ? bankCutoff : paypalCutoff;
    return o.created_at < cutoff;
  });

  const released: SweepResult["released"] = [];
  for (const order of candidates) {
    const units = await unitsForOrder(order.id);
    const ok = await releaseStockOnce(order.id, units);
    if (!ok) continue; // someone paid in the meantime, or nothing to release

    await supabase
      .from("buy_orders")
      .update({
        status: "cancelled",
        payment_status: "abandoned",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("payment_status", "pending"); // still unpaid at the moment of writing

    released.push({ id: order.id, method: order.payment_method, total: order.total });
  }

  return { released, scanned: candidates.length };
}
