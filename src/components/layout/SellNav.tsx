"use client";

import Link from "next/link";
import { sellNav } from "@/data/navigation";

export default function SellNav() {
  return (
    <nav className="hidden bg-grey-darker text-pure-white lg:block" aria-label="Trade-in categories">
      <div className="container">
        <ul className="flex items-stretch gap-1">
          {sellNav.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="flex whitespace-nowrap px-4 py-3.5 text-sm font-medium text-pure-white transition hover:text-mode-primary"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
