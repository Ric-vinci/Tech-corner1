import { notFound } from "next/navigation";
import StoreShell from "@/components/layout/StoreShell";
import Breadcrumbs from "@/components/catalog/Breadcrumbs";
import BuyProductDetailView from "@/components/buy/BuyProductDetailView";
import { getBuyProductDetail } from "@/lib/buy/product";

export default async function BuyProductPage({ handle }: { handle: string }) {
  const detail = await getBuyProductDetail(handle);
  if (!detail) notFound();

  return (
    <StoreShell store="buy">
      <main className="container pb-16 pt-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/buy-used" },
            { label: "Refurbished Phones", href: "/buy-used/mobile-phones" },
            { label: "Refurbished Samsung Mobile Phones", href: "/buy-used/mobile-phones/samsung" },
            { label: detail.modelName },
          ]}
        />
        <BuyProductDetailView detail={detail} />
      </main>
    </StoreShell>
  );
}
