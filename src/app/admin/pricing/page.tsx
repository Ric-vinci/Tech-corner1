import { redirect } from "next/navigation";
import PricingTable from "@/components/admin/PricingTable";
import { getAdminSession } from "@/lib/admin/session";
import { listPricingProducts } from "@/lib/shopify/admin-pricing";
import { storeCreditBonus } from "@/lib/trade-in/bonus";
import { isAdminCategory } from "@/lib/admin/categories";

export const metadata = { title: "Pricing — 4gadgets Admin" };

type Props = {
  searchParams: Promise<{ page?: string; q?: string; category?: string }>;
};

export default async function AdminPricingPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { page: pageParam, q, category } = await searchParams;
  const activeCategory = isAdminCategory(category) ? category : undefined;
  const result = await listPricingProducts({
    page: Number(pageParam) || 1,
    search: q,
    category: activeCategory,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Pricing</h1>
        <p className="mt-1 text-sm text-grey-dark">
          Trade-in quotes by condition. Changes are written straight to the Shopify catalogue.
        </p>
      </div>

      <PricingTable
        products={result.products}
        page={result.page}
        totalPages={result.totalPages}
        search={q}
        category={activeCategory}
        bonus={storeCreditBonus()}
      />
    </div>
  );
}
