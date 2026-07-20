import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { markRefurbUnitsSold, restoreRefurbStock } from "@/lib/shopify/admin-inventory";

/**
 * Stock movements for a buy order, each applied at most once.
 *
 * A device leaves stock when the order is created — a PayPal approval window or
 * a pending bank transfer must not leave it sellable to someone else. It comes
 * back if that payment never arrives or is refunded.
 *
 * The `stock_taken` / `stock_released` flags (migration 012) are what make this
 * exactly-once. Several paths legitimately fire for one order — the browser
 * return URL, the PayPal webhook (at-least-once by design) and the abandoned
 * sweeper — and without the flags they each moved stock again.
 *
 * Both are best-effort by design: they must never fail a payment that has
 * already settled. A miss is visible in the reconciliation report instead.
 */

type Unit = { productId: string; qty: number };

/**
 * Migration 012 may not have been applied yet (deploy races migration). Without
 * the flag columns we can't dedupe, but silently doing NOTHING would be far
 * worse — a sold device would stay on sale. So fall back to the previous
 * behaviour and warn.
 */
const isMissingColumn = (error: { message?: string } | null) =>
  Boolean(error?.message && /stock_taken|stock_released|column/i.test(error.message));

/** Take devices out of stock for this order, unless already taken. */
export async function takeStockOnce(orderId: string, units: Unit[]): Promise<boolean> {
  if (!units.length) return false;
  const supabase = getSupabaseAdmin();

  // Conditional update = the claim. If no row comes back, another path already
  // took the stock and this call must not decrement a second time.
  const { data, error } = await supabase
    .from("buy_orders")
    .update({ stock_taken: true, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("stock_taken", false)
    .select("id")
    .maybeSingle();

  if (error && isMissingColumn(error)) {
    console.warn("[buy-stock] migration 012 not applied — taking stock without once-only guard");
    await markRefurbUnitsSold(units);
    return true;
  }
  if (!data) return false;

  try {
    await markRefurbUnitsSold(units);
    return true;
  } catch (err) {
    console.error(`[buy-stock] take failed for ${orderId}:`, err);
    await supabase.from("buy_orders").update({ stock_taken: false }).eq("id", orderId);
    return false;
  }
}

/** Put devices back, unless they were never taken or are already back. */
export async function releaseStockOnce(orderId: string, units: Unit[]): Promise<boolean> {
  if (!units.length) return false;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("buy_orders")
    .update({ stock_released: true, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("stock_taken", true)
    .eq("stock_released", false)
    .select("id")
    .maybeSingle();

  if (error && isMissingColumn(error)) {
    console.warn("[buy-stock] migration 012 not applied — restoring stock without once-only guard");
    await restoreRefurbStock(units);
    return true;
  }
  if (!data) return false;

  try {
    await restoreRefurbStock(units);
    return true;
  } catch (err) {
    console.error(`[buy-stock] release failed for ${orderId}:`, err);
    await supabase.from("buy_orders").update({ stock_released: false }).eq("id", orderId);
    return false;
  }
}
