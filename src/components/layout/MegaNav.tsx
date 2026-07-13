"use client";

import Link from "next/link";
import { useState } from "react";
import { megaNav } from "@/data/navigation";
import { ChevronDown } from "@/components/ui/Icons";

export default function MegaNav() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <nav className="hidden bg-grey-darker text-pure-white lg:block" aria-label="Product categories">
      <div className="container">
        <ul className="flex items-stretch gap-1" onMouseLeave={() => setOpenIndex(null)}>
          {megaNav.map((item, i) => {
            const hasMenu = !!item.columns?.length;
            return (
              <li key={item.label} className="static" onMouseEnter={() => setOpenIndex(hasMenu ? i : null)}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 whitespace-nowrap px-4 py-3.5 text-sm font-medium transition hover:text-mode-primary ${
                    openIndex === i ? "text-mode-primary" : "text-pure-white"
                  } ${item.label === "Big Deals" ? "!text-mode-primary" : ""}`}
                >
                  {item.label}
                  {hasMenu && <ChevronDown className="h-3.5 w-3.5" />}
                </Link>

                {hasMenu && openIndex === i && (
                  <div className="absolute inset-x-0 top-full z-40 border-t border-grey-light bg-pure-white shadow-hover">
                    <div className="container grid grid-cols-5 gap-8 py-8">
                      {item.columns!.map((col) => (
                        <div key={col.title}>
                          <Link
                            href={col.href}
                            className="mb-4 block font-heading text-base font-semibold text-black hover:text-mode-primary"
                          >
                            {col.title}
                          </Link>
                          <ul className="space-y-2">
                            {col.links.map((link) => (
                              <li key={link.label}>
                                <Link
                                  href={link.href}
                                  className={`block text-sm text-grey-dark transition hover:text-mode-primary ${
                                    link.label.startsWith("Shop All") ? "font-medium text-mode-primary" : ""
                                  }`}
                                >
                                  {link.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    {item.footerLinks && (
                      <div className="border-t border-grey-light">
                        <div className="container flex flex-wrap gap-6 py-4">
                          {item.footerLinks.map((link) => (
                            <Link
                              key={link.label}
                              href={link.href}
                              className="text-sm font-medium text-mode-primary hover:underline"
                            >
                              {link.label} &rarr;
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
