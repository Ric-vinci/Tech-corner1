"use client";

import Link from "next/link";
import { useState } from "react";
import { megaNav, secondaryNav, sellNav, sellSecondaryNav } from "@/data/navigation";
import { socialLinks } from "@/data/content";
import { CloseIcon, ChevronDown, SocialIcon } from "@/components/ui/Icons";
import type { StoreMode } from "@/data/types";

export default function MobileMenu({
  store,
  open,
  onClose,
}: {
  store: StoreMode;
  open: boolean;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const navItems = store === "sell" ? sellNav : megaNav;
  const bottomLinks = store === "sell" ? sellSecondaryNav : secondaryNav;

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col bg-pure-white transition-transform lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-grey-light px-5 py-4">
          <span className="font-heading text-lg font-semibold">Menu</span>
          <button onClick={onClose} aria-label="Close menu" className="text-black">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-4">
          <ul className="divide-y divide-grey-light">
            {navItems.map((item) => {
              const hasMenu = store === "buy" && !!item.columns?.length;
              const isOpen = expanded === item.label;
              return (
                <li key={item.label} className="py-1">
                  <div className="flex items-center justify-between">
                    <Link href={item.href} onClick={onClose} className="block py-2.5 font-medium">
                      {item.label}
                    </Link>
                    {hasMenu && (
                      <button
                        aria-label={`Toggle ${item.label}`}
                        onClick={() => setExpanded(isOpen ? null : item.label)}
                        className="p-2 text-grey-dark"
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>
                  {hasMenu && isOpen && (
                    <div className="pb-3 pl-3">
                      {item.columns!.map((col) => (
                        <div key={col.title} className="mb-3">
                          <Link
                            href={col.href}
                            onClick={onClose}
                            className="mb-1 block text-sm font-semibold text-mode-primary"
                          >
                            {col.title}
                          </Link>
                          <ul className="space-y-1.5">
                            {col.links.slice(0, 6).map((link) => (
                              <li key={link.label}>
                                <Link href={link.href} onClick={onClose} className="block text-sm text-grey-dark">
                                  {link.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <ul className="mt-6 space-y-2 border-t border-grey-light pt-4">
            {bottomLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} onClick={onClose} className="block py-1.5 text-sm text-grey-dark">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex gap-4 border-t border-grey-light pt-5">
            {socialLinks.map((s) => (
              <a
                key={s.platform}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="text-grey-dark transition hover:text-mode-primary"
              >
                <SocialIcon platform={s.platform} className="h-5 w-5" />
              </a>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
