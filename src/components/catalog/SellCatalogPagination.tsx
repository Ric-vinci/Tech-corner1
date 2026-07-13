import Link from "next/link";
import { buildSellCatalogQuery } from "@/lib/sell/catalog-params";
import type { SellCatalogParams } from "@/lib/sell/catalog-params";

type Props = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  limit: number;
  sort: SellCatalogParams["sort"];
  /** Optional override so callers can preserve extra query params (e.g. a model filter). */
  hrefForPage?: (page: number) => string;
};

export default function SellCatalogPagination({ basePath, currentPage, totalPages, limit, sort, hrefForPage }: Props) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);

  function pageHref(page: number) {
    if (hrefForPage) return hrefForPage(page);
    return `${basePath}${buildSellCatalogQuery({ limit, page, sort })}`;
  }

  return (
    <div className="flex justify-center order-2 col-span-4 pages mt-6 mb-4">
      <strong className="sr-only label pages-label">Page</strong>
      <ul className="relative z-0 inline-flex items pages-items" aria-label="Page">
        {pages.map((page) => (
          <li
            key={page}
            className={`relative inline-flex items-center -ml-px text-sm font-medium leading-5 text-gray-700 transition duration-150 ease-in-out item ${
              page === currentPage ? "current border-primary" : "hover:text-gray-500"
            }`}
          >
            {page === currentPage ? (
              <strong className="px-4 py-2 cursor-default page">
                <span className="sr-only label">You&apos;re currently reading page</span>
                <span>{page}</span>
              </strong>
            ) : (
              <Link href={pageHref(page)} className="px-4 py-2 page">
                <span className="sr-only label">Page</span>
                <span>{page}</span>
              </Link>
            )}
          </li>
        ))}
        {currentPage < totalPages && (
          <li className="relative inline-flex items-center px-3 py-2 -ml-px text-sm font-medium leading-5 text-gray-500 transition duration-150 ease-in-out item pages-item-next rounded-r-md hover:text-gray-400">
            <Link href={pageHref(currentPage + 1)} className="action next" title="Next">
              <span className="sr-only label">Page</span>
              <span>
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
