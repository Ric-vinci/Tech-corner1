"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { cartTotal, type TradeInCartItem } from "@/lib/cart/trade-in-cart";
import { formatGbpCompact, formatGbpTotal, itemLineTotal } from "@/lib/cart/format";

function DrawerTickList({
  condition,
  paymentMethod,
  returnPack,
}: {
  condition: string;
  paymentMethod: string;
  returnPack: string;
}) {
  return (
    <ul className="tick-list flex flex-wrap mt-2 text-sm">
      <li className="md:w-1/2">{condition}</li>
      <li className="md:w-1/2">{paymentMethod}</li>
      <li className="md:w-1/2">{returnPack}</li>
    </ul>
  );
}

function DrawerItem({ item }: { item: TradeInCartItem }) {
  const [open, setOpen] = useState(false);
  const lineTotal = itemLineTotal(item.unitPrice, item.quantity);
  const toggleId = `cart-item-${item.id}-toggle`;
  const detailsId = `cart-item-${item.id}-details`;

  return (
    <div className="border-grey-light cart-item-sell first-of-type:mt-4">
      <div className="rounded-lg p-5 bg-grey-lightest border-grey-light border mb-4">
        <p
          role="button"
          tabIndex={0}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen((v) => !v);
            }
          }}
          className="cursor-pointer flex items-center"
        >
          <span className="pr-3">
            <span>Trade In – </span>
            <span className="font-bold">
              {item.productName} x {item.quantity}
            </span>
          </span>
          <span id={toggleId} className={`cart-item-toggle${open ? " rotate-180" : ""}`} />
        </p>

        <p className="text-xs mt-1">
          The <span className="font-bold">{formatGbpCompact(lineTotal)}</span> will be sent to your account once
          we&apos;ve received your device.
        </p>

        <div id={detailsId} className={open ? "" : "hidden"}>
          <div className="bg-white rounded-lg p-4 flex items-center mt-2 shadow">
            <img src={item.image} alt={item.productName} width={32} height={32} loading="lazy" className="object-contain" />
            <div className="pl-2">
              <span className="block font-semibold">{item.productName}</span>
              <span className="block text-xs">We&apos;ll pay you</span>
              <span className="block text-sm text-green font-medium">{formatGbpCompact(lineTotal)}</span>
            </div>
          </div>
          <DrawerTickList condition={item.condition} paymentMethod={item.paymentMethod} returnPack={item.returnPack} />
        </div>
      </div>
    </div>
  );
}

export default function TradeInCartDrawer() {
  const { items, count, drawerOpen, closeDrawer } = useCart();
  const total = cartTotal(items);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (drawerOpen) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), 300);
    return () => window.clearTimeout(timer);
  }, [drawerOpen]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, closeDrawer]);

  useEffect(() => {
    if (!mounted) return;
    const onMouseDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closeDrawer();
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [mounted, closeDrawer]);

  if (!mounted) return null;

  return (
    <section
      id="cart-drawer"
      role="presentation"
      aria-hidden={!drawerOpen}
      className="sell-my fixed inset-y-0 right-0 z-30 flex w-11/12 max-w-[415px]"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-labelledby="cart-drawer-title"
        aria-modal="true"
        className={`relative w-full transition-transform duration-300 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col bg-white p-6">
          <header className="flex shrink-0 items-center justify-between border-b border-grey-light pb-6">
            <div id="cart-drawer-title" className="font-heading font-bold text-3xl">
              My Basket
            </div>
            {count > 0 && (
              <span className="text-grey-dark text-sm px-4 ml-auto">
                {count} {count === 1 ? "item" : "items"}
              </span>
            )}
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close panel"
              className="w-12 h-12 flex items-center justify-center bg-grey-lightest rounded-lg border border-grey-light"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M17.53 1.53A.75.75 0 0 0 16.47.47l1.06 1.06ZM1.53.47A.75.75 0 0 0 .47 1.53L1.53.47Zm-1.06 16a.75.75 0 1 0 1.06 1.06L.47 16.47Zm16 1.06a.75.75 0 1 0 1.06-1.06l-1.06 1.06Zm0-17.06-8 8 1.06 1.06 8-8L16.47.47Zm-6.94 8-8-8L.47 1.53l8 8 1.06-1.06Zm-8 9.06 8-8-1.06-1.06-8 8 1.06 1.06Zm6.94-8 8 8 1.06-1.06-8-8-1.06 1.06Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </header>

          {count > 0 ? (
            <>
              <div className="overflow-y-auto bg-white">
                {items.map((item) => (
                  <DrawerItem key={item.id} item={item} />
                ))}
              </div>

              <div>
                <div className="flex items-baseline justify-between pb-5">
                  <span className="text-dark">Total</span>
                  <span className="font-heading text-2xl font-medium">{formatGbpTotal(total)}</span>
                </div>
                <div className="border-t border-grey-light pt-4">
                  <Link
                    href="/sell-my/checkout/cart"
                    className="btn btn-secondary mb-4 block w-full text-center"
                    onClick={closeDrawer}
                  >
                    View &amp; Edit My Basket
                  </Link>
                  <Link
                    href="/sell-my/checkout"
                    className="btn btn-primary inline-flex w-full justify-center"
                    onClick={closeDrawer}
                  >
                    Checkout Securely
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center py-12 text-sm text-grey-dark">
              Your basket is empty.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
