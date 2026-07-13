type Props = {
  limit?: number;
};

function ProductCardSkeleton() {
  return (
    <div className="product_addtocart_form relative bg-white rounded-lg px-2.5 py-7 shadow-sm h-full md:pb-2.5 md:pt-8 w-full animate-pulse">
      <div className="flex h-full items-center md:flex-col md:items-start">
        <div className="mx-auto w-[70px] shrink-0 md:w-[140px] md:mb-3">
          <div className="aspect-square rounded-lg bg-grey-lighter" />
        </div>
        <div className="flex flex-col flex-grow pl-4 md:w-full md:pl-0">
          <div className="mb-1 md:p-1.5 md:mb-8 space-y-2">
            <div className="h-4 w-4/5 rounded bg-grey-lighter" />
            <div className="h-4 w-3/5 rounded bg-grey-lighter" />
          </div>
          <div className="h-4 w-24 rounded bg-grey-lighter md:p-1.5" />
        </div>
      </div>
    </div>
  );
}

export default function SellBrandCatalogSkeleton({ limit = 16 }: Props) {
  const count = Math.min(limit, 12);

  return (
    <>
      <div className="toolbar-products flex flex-wrap items-center justify-between gap-3 py-4 animate-pulse">
        <div className="h-4 w-40 rounded bg-grey-lighter" />
        <div className="flex gap-3">
          <div className="h-9 w-28 rounded bg-grey-lighter" />
          <div className="h-9 w-36 rounded bg-grey-lighter" />
        </div>
      </div>
      <div className="products wrapper mode-grid products-grid">
        <div className="mx-auto pt-4 pb-12 grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: count }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
