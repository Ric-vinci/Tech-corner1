import type { ReactNode } from "react";

import Breadcrumbs from "@/components/catalog/Breadcrumbs";
import CategoryHero from "@/components/catalog/CategoryHero";
import SellFilterSidebar from "@/components/catalog/SellFilterSidebar";
import StoreShell from "@/components/layout/StoreShell";
import type { BreadcrumbItem, ModelFilterLink } from "@/data/types";

type Props = {
  pageTitle: string;
  heroImage?: string;
  categoryTitle: string;
  modelLinks: ModelFilterLink[];
  breadcrumbs?: BreadcrumbItem[];
  children: ReactNode;
};

export default function SellBrandPageShell({
  pageTitle,
  heroImage,
  categoryTitle,
  modelLinks,
  breadcrumbs,
  children,
}: Props) {
  const breadcrumbItems = breadcrumbs ?? [
    { label: "Home", href: "/sell-my" },
    { label: categoryTitle, href: "/sell-my/mobile" },
    { label: pageTitle },
  ];

  return (
    <StoreShell store="sell">
      <main className="page-main page-with-filter page-layout-2columns-left catalog-category-view">
        <div className="container -mb-4">
          <CategoryHero title={pageTitle} image={heroImage ?? ""} variant="sell" />
        </div>

        <Breadcrumbs items={breadcrumbItems} variant="sell" />

        <div className="columns">
          <SellFilterSidebar modelLinks={modelLinks} />
          <div className="column main">{children}</div>
        </div>
      </main>
    </StoreShell>
  );
}
