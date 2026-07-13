import SellBrandCatalogSkeleton from "@/components/catalog/SellBrandCatalogSkeleton";
import StoreShell from "@/components/layout/StoreShell";

export default function SellBrandLoading() {
  return (
    <StoreShell store="sell">
      <main className="page-main page-with-filter page-layout-2columns-left catalog-category-view">
        <div className="container -mb-4">
          <div className="h-32 md:h-48 rounded-2xl bg-grey-lighter animate-pulse" />
        </div>
        <div className="columns">
          <aside className="sidebar sidebar-main w-full md:w-64 shrink-0">
            <div className="h-6 w-24 rounded bg-grey-lighter animate-pulse mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="h-4 w-full rounded bg-grey-lighter animate-pulse" />
              ))}
            </div>
          </aside>
          <div className="column main">
            <SellBrandCatalogSkeleton />
          </div>
        </div>
      </main>
    </StoreShell>
  );
}
