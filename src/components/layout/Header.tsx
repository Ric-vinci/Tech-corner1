"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import { megaNav, sellNav } from "@/data/navigation";
import { useNavItems } from "@/components/layout/NavProvider";
import SellCartLink from "@/components/cart/SellCartLink";
import BuyCartLink from "@/components/cart/BuyCartLink";
import BrandLogo from "@/components/layout/BrandLogo";
import type { NavItem, StoreMode } from "@/data/types";

const ChevronRight = () => (
  <svg className="md:hidden" width="11" height="20" viewBox="0 0 11 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.53.47A.75.75 0 0 0 .47 1.53L1.53.47ZM10 10l.53.53a.75.75 0 0 0 0-1.06L10 10ZM.47 18.47a.75.75 0 1 0 1.06 1.06L.47 18.47Zm0-16.94 9 9 1.06-1.06-9-9L.47 1.53Zm9 7.94-9 9 1.06 1.06 9-9-1.06-1.06Z" fill="#0E1012" />
  </svg>
);

function Navigation({ items, store }: { items: NavItem[]; store: StoreMode }) {
  return (
    <nav className="navigation">
      <ul className="navigation__list">
        {items.map((item) => {
          const hasSub = !!item.columns?.length;
          const isDeals = item.label === "Big Deals";
          return (
            <li
              key={item.label}
              className={`navigation__item ${hasSub ? "navigation__item--parent" : ""} ${isDeals ? "deals" : ""}`}
            >
              <span>
                <Link href={item.href} className="navigation__link">
                  {item.label}
                  {hasSub && <ChevronRight />}
                </Link>

                {hasSub && (
                  <div className="navigation__submenu-wrapper navigation__submenu-wrapper--level1">
                    <div className="navigation__submenu-title navigation__submenu-title--level1">
                      {store === "sell" ? "Categories" : "Popular Brands"}
                    </div>
                    <div className="navigation__submenu">
                      <ul className="navigation__inner-list navigation__inner-list--level1">
                        {item.columns!.map((col) => (
                          <li
                            key={col.title}
                            className="navigation__inner-item navigation__inner-item--level1 navigation__inner-item--parent"
                          >
                            <Link href={col.href} className="navigation__inner-link">
                              {col.title}
                              <ChevronRight />
                            </Link>
                            <div className="navigation__submenu-wrapper navigation__submenu-wrapper--level2">
                              <div className="navigation__submenu-title navigation__submenu-title--level2">
                                {col.title}
                              </div>
                              <div className="navigation__submenu">
                                <ul className="navigation__inner-list navigation__inner-list--level2">
                                  {col.links.map((link) => (
                                    <li
                                      key={link.label}
                                      className="navigation__inner-item navigation__inner-item--level2"
                                    >
                                      <Link href={link.href} className="navigation__inner-link">
                                        {link.label}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function Header({ store = "buy" }: { store?: StoreMode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isSell = store === "sell";
  const contextNav = useNavItems();
  const navItems = contextNav ?? (isSell ? sellNav : megaNav);
  const homeHref = isSell ? "/sell-my" : "/";
  const searchAction = isSell ? "/sell-my/catalogsearch/result/" : "/buy-used/catalogsearch/result/";
  const accountHref = "/sell-my/customer/account";

  return (
    <div className="relative z-30 w-full bg-white">
      <div className="container grid grid-cols-3 items-center md:flex md:p-5">
        {/* Buy / Sell switch */}
        <div className="py-3.5 -mx-4 mb-3 col-span-3 md:h-12 md:order-1 md:m-0 md:py-2 md:px-4 md:rounded-lg md:border bg-mode-secondary md:border-mode-primary">
          <div className="mode-switch flex justify-center items-center md:h-full">
            <Link
              href="/buy-used"
              className={`w-20 text-right cursor-pointer md:w-9 ${isSell ? "text-grey-dark" : "text-black font-bold"}`}
            >
              Buy
            </Link>
            <Link
              href={isSell ? "/buy-used" : "/sell-my"}
              aria-label="Toggle store"
              className="flex items-center relative w-10 h-6 py-[3px] px-1 mx-4 my-0 rounded-full overflow-hidden"
            >
              <input
                type="checkbox"
                checked={isSell}
                readOnly
                className="cursor-pointer border-0 absolute top-0 left-0 w-full h-full peer appearance-none bg-mode-primary"
              />
              <span className="cursor-pointer relative inline-block duration-300 ease-in-out w-4 h-4 bg-white rounded-full peer-checked:translate-x-4" />
            </Link>
            <Link
              href="/sell-my"
              className={`w-20 cursor-pointer md:w-16 ${isSell ? "text-black font-bold" : "text-grey-dark"}`}
            >
              Sell
            </Link>
          </div>
        </div>

        {/* Mobile nav toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="cursor-pointer md:hidden"
        >
          <svg className="block w-10 h-9 p-2 fill-current" width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1h22M1 10h22M1 19h22" stroke="#0E1012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Logo */}
        <div className="logo flex w-full items-center justify-center justify-self-center md:w-auto md:mr-4">
          <Link href={homeHref} title="Tech Corner" aria-label="Tech Corner home" className="flex items-center">
            <BrandLogo />
          </Link>
        </div>

        {/* Account + Cart */}
        <div className="flex items-center justify-self-end md:order-2 md:pl-8">
          <Link href={accountHref} className="block hover:text-black" aria-label="My Account">
            <svg width="24" height="26" viewBox="0 0 24 26" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.333 25a1 1 0 1 0 2 0h-2ZM17 17v-1 1ZM6.333 17v-1 1ZM1 22.333H0h1ZM0 25a1 1 0 1 0 2 0H0Zm23.333 0v-2.667h-2V25h2Zm0-2.667c0-1.68-.667-3.29-1.855-4.478l-1.414 1.414a4.333 4.333 0 0 1 1.27 3.064h2Zm-1.855-4.478A6.333 6.333 0 0 0 17 16v2c1.15 0 2.252.456 3.064 1.27l1.414-1.415ZM17 16H6.333v2H17v-2ZM6.333 16c-1.68 0-3.29.667-4.478 1.855l1.414 1.414A4.333 4.333 0 0 1 6.333 18v-2Zm-4.478 1.855A6.333 6.333 0 0 0 0 22.333h2c0-1.149.457-2.251 1.27-3.064l-1.415-1.414ZM0 22.333V25h2v-2.667H0Zm16-16a4.333 4.333 0 0 1-4.333 4.334v2A6.333 6.333 0 0 0 18 6.333h-2Zm-4.333 4.334a4.333 4.333 0 0 1-4.334-4.334h-2a6.333 6.333 0 0 0 6.334 6.334v-2ZM7.333 6.333A4.333 4.333 0 0 1 11.667 2V0a6.333 6.333 0 0 0-6.334 6.333h2ZM11.667 2A4.333 4.333 0 0 1 16 6.333h2A6.333 6.333 0 0 0 11.667 0v2Z" fill="#0E1012" />
            </svg>
          </Link>
          {isSell ? <SellCartLink /> : <BuyCartLink />}
        </div>

        {/* Search */}
        <div className="col-span-3 md:flex-1 md:px-5">
          <div className="py-4 mx-auto text-black">
            <form className="form minisearch relative" action={searchAction} method="get">
              <label className="absolute left-4 top-1/2 transform -translate-y-1/2 m-0 z-40" htmlFor="search">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.47 17.53a.75.75 0 1 0 1.06-1.06l-1.06 1.06Zm-3.962-6.083a.75.75 0 0 0-1.06 1.061l1.06-1.06Zm.61-4.013a5.684 5.684 0 0 1-5.684 5.684v1.5a7.184 7.184 0 0 0 7.184-7.184h-1.5Zm-5.684 5.684A5.684 5.684 0 0 1 1.75 7.434H.25a7.184 7.184 0 0 0 7.184 7.184v-1.5ZM1.75 7.434A5.684 5.684 0 0 1 7.434 1.75V.25A7.184 7.184 0 0 0 .25 7.434h1.5ZM7.434 1.75a5.684 5.684 0 0 1 5.684 5.684h1.5A7.184 7.184 0 0 0 7.434.25v1.5ZM17.53 16.47l-5.022-5.023-1.06 1.061 5.022 5.022 1.06-1.06Z" fill="#0E1012" />
                </svg>
              </label>
              <input
                id="search"
                type="text"
                name="q"
                placeholder={isSell ? "Start typing to find your device..." : "Search for a device..."}
                className="form-input h-12 pl-11 w-full leading-normal transition appearance-none rounded-lg border border-grey-light focus:border-black relative z-30"
                maxLength={128}
                autoComplete="off"
              />
              <button type="submit" title="Search" className="action search sr-only" aria-label="Search">
                <span>Search</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Navigation menu */}
      <div
        className={`nav-menu md-max:fixed md-max:top-0 md-max:left-0 md-max:bottom-0 md-max:max-w-[335px] md-max:w-11/12 md-max:bg-white md-max:z-50 md-max:transition md:relative md:bg-grey-darker md:min-h-14 md-max:overflow-auto ${
          menuOpen ? "md-max:translate-x-0" : "md-max:-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 md:hidden">
          <span className="font-medium text-2xl">Menu</span>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="cursor-pointer w-12 h-12 bg-grey-lightest rounded-lg border border-grey-light flex items-center justify-center"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.53 1.53A.75.75 0 0 0 16.47.47l1.06 1.06ZM1.53.47A.75.75 0 0 0 .47 1.53L1.53.47Zm-1.06 16a.75.75 0 1 0 1.06 1.06L.47 16.47Zm16 1.06a.75.75 0 1 0 1.06-1.06l-1.06 1.06Zm0-17.06-8 8 1.06 1.06 8-8L16.47.47Zm-6.94 8-8-8L.47 1.53l8 8 1.06-1.06Zm-8 9.06 8-8-1.06-1.06-8 8 1.06 1.06Zm6.94-8 8 8 1.06-1.06-8-8-1.06 1.06Z" fill="#0E1012" />
            </svg>
          </button>
        </div>
        <Navigation items={navItems} store={store} />
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-hidden
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
