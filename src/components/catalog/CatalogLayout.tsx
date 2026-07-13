import type { ReactNode } from "react";
import FilterSidebar from "./FilterSidebar";
import type { FilterGroup } from "@/data/types";

type Props = {
  filters?: FilterGroup[];
  children: ReactNode;
  productCount?: number;
};

export default function CatalogLayout({ filters = [], children, productCount }: Props) {
  return (
    <div className="catalog-layout">
      <FilterSidebar groups={filters} />
      <div className="catalog-main">
        {productCount !== undefined && (
          <p className="mb-4 text-sm text-grey-dark">{productCount} product{productCount !== 1 ? "s" : ""}</p>
        )}
        {children}
      </div>
    </div>
  );
}
