import { redirect } from "next/navigation";
import RefurbInventoryTable, { type RefurbRow } from "@/components/admin/RefurbInventoryTable";
import { getAdminSession } from "@/lib/admin/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { listRefurbUnits, countRefurbUnits } from "@/lib/shopify/admin-inventory";
import { isAdminCategory } from "@/lib/admin/categories";

export const metadata = { title: "Refurb stock — 4gadgets Admin" };

type Props = {
  searchParams: Promise<{ page?: string; category?: string; status?: string; q?: string }>;
};

export default async function AdminInventoryPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { page: pageParam, category, status, q } = await searchParams;
  const activeCategory = isAdminCategory(category) ? category : undefined;
  const activeStatus = status === "live" || status === "draft" ? status : undefined;

  const [page, counts] = await Promise.all([
    listRefurbUnits({ page: Number(pageParam) || 1, category: activeCategory, status: activeStatus, search: q }),
    countRefurbUnits(activeCategory),
  ]);

  // Join each Shopify unit with the trade-in it came from (grade + what it cost).
  const productIds = page.units.map((u) => u.id);
  const bySource = new Map<
    string,
    { submissionId: string; condition: string; cost: number }
  >();

  if (productIds.length) {
    const { data } = await getSupabaseAdmin()
      .from("trade_in_submissions")
      .select("id, shopify_inventory_product_id, condition, quoted_price, revised_price")
      .in("shopify_inventory_product_id", productIds);

    for (const row of data ?? []) {
      if (!row.shopify_inventory_product_id) continue;
      bySource.set(row.shopify_inventory_product_id, {
        submissionId: row.id,
        condition: row.condition,
        cost: Number(row.revised_price ?? row.quoted_price ?? 0),
      });
    }
  }

  const rows: RefurbRow[] = page.units.map((unit) => {
    const source = bySource.get(unit.id);
    return {
      ...unit,
      condition: source?.condition ?? null,
      cost: source?.cost ?? null,
      submissionId: source?.submissionId ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Refurb stock</h1>
        <p className="mt-1 text-sm text-grey-dark">
          Individual devices you now own from accepted trade-ins. Each row is one physical unit — not a catalogue model.
          Set a resale price and publish it to the storefront when it&apos;s ready.
        </p>
      </div>

      <RefurbInventoryTable
        rows={rows}
        page={page.page}
        totalPages={page.totalPages}
        category={activeCategory}
        status={activeStatus}
        search={q}
        total={counts.total}
        live={counts.live}
      />
    </div>
  );
}
