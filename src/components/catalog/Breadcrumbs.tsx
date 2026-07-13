import Link from "next/link";
import type { BreadcrumbItem } from "@/data/types";

export default function Breadcrumbs({ items, variant = "default" }: { items: BreadcrumbItem[]; variant?: "default" | "sell" }) {
  if (variant === "sell") {
    return (
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <div className="container">
          <ol className="items list-reset py-4 rounded flex flex-wrap text-grey text-sm">
            {items.map((item, i) => (
              <li key={item.label} className="item flex">
                {i > 0 && <span aria-hidden="true" className="separator text-primary-lighter px-2">/</span>}
                {item.href ? (
                  <Link href={item.href} className="no-underline" title={`Go to ${item.label}`}>
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-primary-lighter" aria-current="page">
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-grey-dark">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} className="transition hover:text-black">
                {item.label}
              </Link>
            ) : (
              <span className="text-black">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
