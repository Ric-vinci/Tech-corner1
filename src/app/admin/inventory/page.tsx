import { redirect } from "next/navigation";
import RefurbModelList from "@/components/admin/RefurbModelList";
import { getAdminSession } from "@/lib/admin/session";
import { listRefurbModels, countRefurbUnits } from "@/lib/shopify/admin-inventory";
import { isAdminCategory } from "@/lib/admin/categories";

export const metadata = { title: "Refurb stock — 4gadgets Admin" };

type Props = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

export default async function AdminInventoryPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { category, q } = await searchParams;
  const activeCategory = isAdminCategory(category) ? category : undefined;

  const [models, counts] = await Promise.all([
    listRefurbModels({ category: activeCategory, search: q }),
    countRefurbUnits(activeCategory),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Refurb stock</h1>
        <p className="mt-1 text-sm text-grey-dark">
          Devices you own from accepted trade-ins, grouped by model. Open a model to see its storage sizes and
          individual units, price and publish them.
        </p>
      </div>

      <RefurbModelList models={models} category={activeCategory} search={q} total={counts.total} live={counts.live} />
    </div>
  );
}
