import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import RefurbModelDetail from "@/components/admin/RefurbModelDetail";
import type { RefurbRow } from "@/components/admin/RefurbInventoryTable";
import { getAdminSession } from "@/lib/admin/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { fetchRefurbUnitsForModel, sizeFromTitle } from "@/lib/shopify/admin-inventory";
import { isAdminCategory } from "@/lib/admin/categories";

export const metadata = { title: "Refurb model — 4gadgets Admin" };

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string }>;
};

export default async function AdminRefurbModelPage({ params, searchParams }: Props) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { slug } = await params;
  const { category } = await searchParams;
  const activeCategory = isAdminCategory(category) ? category : undefined;

  const { modelName, units } = await fetchRefurbUnitsForModel(slug, activeCategory);
  if (!units.length) notFound();

  // Join each unit with the trade-in it came from (grade, per-unit cost, quantity).
  const bySource = new Map<string, { submissionId: string; condition: string; cost: number; quantity: number }>();
  const { data } = await getSupabaseAdmin()
    .from("trade_in_submissions")
    .select("id, shopify_inventory_product_id, condition, quoted_price, revised_price, quantity")
    .in("shopify_inventory_product_id", units.map((u) => u.id));
  for (const row of data ?? []) {
    if (!row.shopify_inventory_product_id) continue;
    const qty = Math.max(1, Math.floor(Number(row.quantity) || 1));
    bySource.set(row.shopify_inventory_product_id, {
      submissionId: row.id,
      condition: row.condition,
      cost: Number(row.revised_price ?? row.quoted_price ?? 0) / qty,
      quantity: qty,
    });
  }

  const rows: RefurbRow[] = units.map((unit) => {
    const source = bySource.get(unit.id);
    return {
      ...unit,
      condition: source?.condition ?? null,
      cost: source?.cost ?? null,
      submissionId: source?.submissionId ?? null,
      stockQty: source?.quantity ?? 1,
    };
  });

  // Group units by storage size, largest first.
  const groups = new Map<string, RefurbRow[]>();
  for (const r of rows) {
    const size = sizeFromTitle(r.title) ?? "Other";
    (groups.get(size) ?? groups.set(size, []).get(size)!).push(r);
  }
  const sizeGb = (s: string) => (/tb/i.test(s) ? parseFloat(s) * 1024 : parseFloat(s) || 0);
  const sizeGroups = [...groups.entries()].sort((a, b) => sizeGb(a[0]) - sizeGb(b[0]));

  const live = rows.filter((r) => r.live).length;
  const totalStock = rows.reduce((n, r) => n + (r.stockQty ?? 1), 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/inventory" className="text-sm text-blue hover:underline">← All models</Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">{modelName}</h1>
        <p className="mt-1 text-sm text-grey-dark">
          {rows.length} unit{rows.length === 1 ? "" : "s"} · {totalStock} in stock · {live} live. Units are grouped by
          storage size; set a resale price and publish each one.
        </p>
      </div>

      <RefurbModelDetail sizeGroups={sizeGroups} totalUnits={rows.length} totalStock={totalStock} live={live} />
    </div>
  );
}
