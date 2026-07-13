import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/session";
import { setTradeInPrices, type TradeInPriceUpdate } from "@/lib/shopify/admin-pricing";

type Body = { updates?: TradeInPriceUpdate[] };

/** Batch-write trade-in prices to Shopify. Handles single-row and bulk saves. */
export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates = body.updates ?? [];
  if (!updates.length) {
    return NextResponse.json({ error: "No changes to save." }, { status: 400 });
  }

  const clean = (value: unknown): number | null | undefined => {
    if (value == null || value === "") return undefined;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return undefined;
    return Number(n.toFixed(2));
  };

  const failures: { productId: string; error: string }[] = [];
  let saved = 0;
  let skipped = 0;

  for (const update of updates) {
    if (!update.productId) continue;
    const fields = {
      priceWorking: clean(update.priceWorking),
      priceFaulty: clean(update.priceFaulty),
      priceNoPower: clean(update.priceNoPower),
    };
    // Nothing valid to write (e.g. all blank or negative) — don't count as saved.
    if (fields.priceWorking == null && fields.priceFaulty == null && fields.priceNoPower == null) {
      skipped += 1;
      continue;
    }
    try {
      await setTradeInPrices({ productId: update.productId, ...fields });
      saved += 1;
    } catch (err) {
      failures.push({ productId: update.productId, error: err instanceof Error ? err.message : "Failed" });
    }
  }

  if (saved === 0 && failures.length === 0) {
    return NextResponse.json({ error: "No valid prices to save.", skipped }, { status: 400 });
  }

  if (failures.length) {
    return NextResponse.json({ saved, failures }, { status: failures.length === updates.length ? 500 : 207 });
  }
  return NextResponse.json({ saved });
}
