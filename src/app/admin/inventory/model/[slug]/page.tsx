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

  // Each PRODUCT is one physical device. Join it to the trade-in it came from
  // (submission_id metafield; legacy rows still link by product id) for grade +
  // per-device cost.
  type Source = { submissionId: string; condition: string; cost: number };
  const supabase = getSupabaseAdmin();
  const bySubmission = new Map<string, Source>();
  const byProduct = new Map<string, Source>();

  const subIds = [...new Set(units.map((u) => u.submissionRef).filter(Boolean) as string[])];
  const legacyIds = units.filter((u) => !u.submissionRef).map((u) => u.id);
  const toSource = (row: { id: string; condition: string; quoted_price: number | null; revised_price: number | null; quantity: number | null }): Source => {
    const qty = Math.max(1, Math.floor(Number(row.quantity) || 1));
    return {
      submissionId: row.id,
      condition: row.condition,
      cost: Number(row.revised_price ?? row.quoted_price ?? 0) / qty, // per-device
    };
  };

  if (subIds.length) {
    const { data } = await supabase
      .from("trade_in_submissions")
      .select("id, condition, quoted_price, revised_price, quantity")
      .in("id", subIds);
    for (const row of data ?? []) bySubmission.set(row.id, toSource(row));
  }
  if (legacyIds.length) {
    const { data } = await supabase
      .from("trade_in_submissions")
      .select("id, shopify_inventory_product_id, condition, quoted_price, revised_price, quantity")
      .in("shopify_inventory_product_id", legacyIds);
    for (const row of data ?? []) {
      if (row.shopify_inventory_product_id) byProduct.set(row.shopify_inventory_product_id, toSource(row));
    }
  }

  const rows: RefurbRow[] = units.map((unit) => {
    const source = unit.submissionRef ? bySubmission.get(unit.submissionRef) : byProduct.get(unit.id);
    return {
      ...unit,
      condition: source?.condition ?? null,
      cost: source?.cost ?? null,
      submissionId: source?.submissionId ?? null,
      stockQty: 1, // one product = one physical device
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

  const totalStock = rows.reduce((n, r) => n + (r.stockQty ?? 1), 0);
  const liveDevices = rows.filter((r) => r.live).reduce((n, r) => n + (r.stockQty ?? 1), 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/inventory" className="text-sm text-blue hover:underline">← All models</Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">{modelName}</h1>
        <p className="mt-1 text-sm text-grey-dark">
          {totalStock} device{totalStock === 1 ? "" : "s"} in stock · {liveDevices} live. Devices are grouped by
          storage size; publishing a trade-in lists all its phones at once.
        </p>
      </div>

      <RefurbModelDetail sizeGroups={sizeGroups} totalStock={totalStock} live={liveDevices} />
    </div>
  );
}
