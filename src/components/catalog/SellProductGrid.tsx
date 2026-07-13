/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { CatalogProduct } from "@/data/types";

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1 .25a.75.75 0 1 0 0 1.5V.25ZM4.273 1l.736-.14a.75.75 0 0 0-.736-.61V1Zm2.192 11.477.737-.14-.737.14Zm1.637 1.38v-.75h-.015l.015.75Zm7.953 0 .015-.75h-.015v.75Zm1.057-.378-.483-.574.483.574Zm.579-1.002.737.14v-.006l-.737-.134ZM19 5.286l.738.134A.75.75 0 0 0 19 4.536v.75Zm-13.91-.75a.75.75 0 0 0 0 1.5v-1.5Zm2.524 13.607c0 .04-.016.07-.033.088-.016.017-.028.019-.036.019v1.5c.899 0 1.569-.753 1.569-1.607h-1.5Zm-.069.107c-.007 0-.02-.002-.036-.019a.126.126 0 0 1-.032-.088h-1.5c0 .854.67 1.607 1.568 1.607v-1.5Zm-.068-.107c0-.041.016-.07.032-.088.017-.017.03-.02.036-.02v-1.5c-.898 0-1.568.753-1.568 1.608h1.5Zm.068-.107c.008 0 .02.002.036.019a.126.126 0 0 1 .033.088h1.5c0-.855-.67-1.607-1.569-1.607v1.5Zm9.069.107c0 .04-.016.07-.033.088-.016.017-.028.019-.035.019v1.5c.898 0 1.568-.753 1.568-1.607h-1.5Zm-.069.107c-.007 0-.02-.002-.036-.019a.126.126 0 0 1-.032-.088h-1.5c0 .854.67 1.607 1.569 1.607v-1.5Zm-.068-.107c0-.041.016-.07.032-.088.017-.017.03-.02.037-.02v-1.5c-.9 0-1.569.753-1.569 1.608h1.5Zm.069-.107c.007 0 .02.002.035.019a.126.126 0 0 1 .033.088h1.5c0-.855-.67-1.607-1.569-1.607v1.5ZM1 1.75h3.273V.25H1v1.5Zm2.536-.61 2.193 11.478 1.473-.282L5.01.86l-1.473.282Zm2.193 11.477a2.48 2.48 0 0 0 .832 1.435l.967-1.147a.98.98 0 0 1-.326-.568l-1.473.28Zm.832 1.435a2.34 2.34 0 0 0 1.556.555l-.03-1.5a.84.84 0 0 1-.56-.202l-.966 1.147Zm1.54.555h7.954v-1.5H8.102v1.5Zm7.938 0a2.34 2.34 0 0 0 1.556-.555l-.966-1.147a.84.84 0 0 1-.56.202l-.03 1.5Zm1.556-.555a2.48 2.48 0 0 0 .833-1.435l-1.474-.28a.98.98 0 0 1-.326.568l.968 1.147Zm.834-1.44 1.309-7.192-1.476-.269-1.309 7.192 1.476.268ZM19 4.535H5.09v1.5H19v-1.5Z"
        fill="#fff"
      />
    </svg>
  );
}

function formatPrice(price: string): string {
  const match = price.match(/£[\d,.]+/);
  return match ? match[0] : price;
}

type Props = {
  products: CatalogProduct[];
};

export default function SellProductGrid({ products }: Props) {
  if (!products.length) {
    return (
      <p className="rounded-2xl bg-grey-lighter px-6 py-12 text-center text-grey-dark">
        No products found in this category yet.
      </p>
    );
  }

  return (
    <div className="products wrapper mode-grid products-grid">
      <div className="mx-auto pt-4 pb-12 grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <form
            key={product.href}
            className="product_addtocart_form relative bg-white rounded-lg px-2.5 py-7 shadow-sm hover:shadow-md h-full md:pb-2.5 md:pt-8 w-full"
          >
            <div className="flex h-full items-center md:flex-col md:items-start">
              <Link
                href={product.href}
                className="block mx-auto w-[70px] shrink-0 md:w-auto md:mb-3"
                tabIndex={-1}
              >
                <picture className="object-contain">
                  <img
                    className="object-contain"
                    loading="lazy"
                    alt={product.name}
                    title={product.name}
                    src={product.image}
                    width={210}
                    height={210}
                  />
                </picture>
              </Link>
              <div className="product-info flex flex-col flex-grow pl-4 md:w-full md:pl-0">
                <div className="mb-1 md:p-1.5 md:mb-8">
                  <Link className="product-item-link" href={product.href}>
                    {product.name}
                  </Link>
                </div>
                <div className="flex justify-between md:mt-auto md:items-end action__wrapper">
                  <div className="text-sm font-medium md:p-1.5">
                    Get up to <span>{formatPrice(product.price)}</span>
                  </div>
                  <Link
                    href={product.href}
                    className="btn btn-primary absolute bottom-2.5 right-2.5 w-9 h-9 p-0 rounded-md md:static"
                    aria-label={`Trade in ${product.name}`}
                  >
                    <CartIcon />
                  </Link>
                </div>
              </div>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
