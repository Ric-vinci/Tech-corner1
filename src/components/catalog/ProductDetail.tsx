import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@/data/types";

type Props = {
  product: CatalogProduct;
  store: "buy" | "sell";
  breadcrumbs?: { label: string; href?: string }[];
};

export default function ProductDetail({ product, store }: Props) {
  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-pure-white shadow-md">
        <Image src={product.image} alt={product.name} fill className="object-contain p-8" sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      <div>
        <h1 className="mb-4 text-2xl font-semibold md:text-3xl">{product.name}</h1>
        <p className="mb-6 font-heading text-2xl font-bold text-mode-primary md:text-3xl">{product.price}</p>
        {store === "sell" ? (
          <>
            <p className="mb-6 text-grey-dark">
              Select your device condition on the next step to get your final trade-in price. Free postage included.
            </p>
            <Link href="#" className="btn btn-primary">
              Get Trade-In Price
            </Link>
          </>
        ) : (
          <>
            <p className="mb-6 text-grey-dark">
              Quality refurbished device with 12-month warranty and free next-day delivery on orders placed before 3pm.
            </p>
            <button type="button" className="btn btn-primary">
              Choose Options
            </button>
          </>
        )}
      </div>
    </div>
  );
}
