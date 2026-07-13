"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { CartAttributeList, CartProgressBar, DeleteIcon } from "@/components/cart/CartUi";
import { cartTotal, type TradeInCartItem } from "@/lib/cart/trade-in-cart";
import { formatGbp, itemLineTotal } from "@/lib/cart/format";

function QtySelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (qty: number) => void;
}) {
  const options = Array.from({ length: 10 }, (_, i) => i + 1);
  return (
    <select
      className="form-select update-qty-action"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label="Quantity"
    >
      {options.map((qty) => (
        <option key={qty} value={qty}>
          {qty}
        </option>
      ))}
    </select>
  );
}

function CartItemRow({
  item,
  onQtyChange,
  onRemove,
}: {
  item: TradeInCartItem;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
}) {
  const lineTotal = itemLineTotal(item.unitPrice, item.quantity);

  return (
    <div className="table-row-item flex flex-row flex-wrap md:flex-nowrap items-center lg:grid lg:grid-cols-7 xl:grid-cols-8 py-5 px-3 justify-end md:justify-start bg-white rounded-lg shadow-sm">
      <div className="px-2 md:p-2 w-full lg:w-auto lg:col-span-3 xl:col-span-4 flex md:items-center flex-nowrap flex-row">
        <div className="w-3/12 mr-3 md:mr-4 shrink-0">
          <Link href={item.productHref} className="block">
            <img
              src={item.image}
              alt={item.productName}
              width={135}
              height={135}
              loading="lazy"
              className="product-image-photo w-full max-w-[110px] object-contain"
            />
          </Link>
        </div>

        <div className="basis-0 flex-grow min-w-0">
          <Link href={item.productHref} className="font-medium text-black hover:underline">
            {item.productName}
          </Link>
          <CartAttributeList
            condition={item.condition}
            paymentMethod={item.paymentMethod}
            returnPack={item.returnPack}
          />
        </div>
      </div>

      <div className="hidden lg:block" />

      <div className="w-9/12 lg:w-auto col-span-1 pl-4 md:pl-0 my-4 md:my-0">
        <div className="text-sm text-grey-dark">We&apos;ll pay you</div>
        <div className="text-2xl text-green-darker font-medium">{formatGbp(lineTotal)}</div>
      </div>

      <div className="w-9/12 lg:w-auto flex items-center justify-between lg:justify-end col-span-2">
        <div className="px-2 sm:py-1 lg:p-0 w-9/12 sm:w-4/12 lg:w-auto flex lg:block items-center md:justify-center">
          <QtySelect value={item.quantity} onChange={onQtyChange} />
        </div>
        <button
          type="button"
          title="Remove item"
          onClick={onRemove}
          className="action action-delete btn btn-secondary ml-4 text-grey p-3"
          aria-label="Remove item"
        >
          <DeleteIcon />
        </button>
      </div>
    </div>
  );
}

export default function TradeInCartPage() {
  const { items, count, removeItem, updateQuantity } = useCart();
  const total = cartTotal(items);

  if (!count) {
    return (
      <div className="container py-12 text-center">
        <CartProgressBar />
        <h1 className="text-2xl font-semibold text-black mt-8 mb-4">My Basket</h1>
        <p className="text-grey-dark mb-6">Your basket is empty.</p>
        <Link href="/sell-my/mobile" className="btn btn-primary">
          Find your device
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-container container py-6">
      <div className="flex flex-col md:flex-row items-stretch -mx-3">
        <div className="cart-column __left px-3 md:w-8/12">
          <CartProgressBar />

          <div className="flex items-center justify-between md:mt-8">
            <h1 className="text-gray-900 page-title title-font text-2xl md:text-4xl font-medium mt-6 mb-8 md:my-6 md:mt-0 md:mb-8">
              My Basket
            </h1>
            <Link href="/sell-my/mobile" className="btn btn-secondary hidden md:inline-flex">
              Continue Shopping
            </Link>
          </div>

          <div className="cart-totals-mobile md:hidden mt-5 text-sm text-grey-dark">
            The <span className="font-bold">{formatGbp(total)}</span> will be sent to your account once we&apos;ve
            received your device.
          </div>

          <div className="text-lg font-medium mt-6 md:mt-12 pb-3">Trading In</div>

          <div className="border-container space-y-4 mt-5">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onQtyChange={(qty) => updateQuantity(item.id, qty)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>
        </div>

        <div className="cart-column __right px-3 flex flex-col md:block md:w-4/12 mt-8 md:mt-0">
          <div className="md:bg-white md:rounded-lg md:border md:border-grey-light md:p-6 sticky top-4">
            <h2 className="hidden w-full text-2xl text-center text-gray-900 title-font font-base mb-5 md:text-left md:block">
              Summary
            </h2>
            <p className="text-sm text-grey-dark mb-6">
              The <span className="font-bold">{formatGbp(total)}</span> will be sent to your account once we&apos;ve
              received your device.
            </p>
            <Link href="/sell-my/checkout" className="btn btn-primary w-full block text-center">
              Checkout Securely
            </Link>
            <Link href="/sell-my/mobile" className="btn btn-secondary w-full block text-center mt-4 md:hidden">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
