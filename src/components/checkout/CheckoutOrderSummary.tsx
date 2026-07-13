"use client";

import { bonusFor, storeCreditBonus } from "@/lib/trade-in/bonus";
import type { TradeInCartItem } from "@/lib/cart/trade-in-cart";

type Props = {
  items: TradeInCartItem[];
};

const money = (value: number) => `£${value.toFixed(2)}`;

export default function CheckoutOrderSummary({ items }: Props) {
  const bonusTotal = items.reduce((sum, item) => sum + bonusFor(item.paymentMethod, item.unitPrice) * item.quantity, 0);

  return (
    <div id="opc-sidebar" className="opc-sidebar">
      <div className="opc-block-summary" aria-hidden="true">
        <span className="title">Summary</span>
      </div>

      {/* One card per basket item, each with its own note. */}
      <div className="opc-help-cms">
        {items.map((item) => {
          const bonus = bonusFor(item.paymentMethod, item.unitPrice); // per phone
          return (
            <div key={item.id}>
              <p className="opc-help-cms-item">
                Trade In -{" "}
                <strong>
                  {item.productName}
                  {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                </strong>
              </p>
              {bonus > 0 && (
                <p className="opc-help-cms-note" style={{ color: "#1EB16D" }}>
                  Includes a {money(bonus)} store credit bonus{item.quantity > 1 ? ` per device (${money(bonus * item.quantity)} total)` : ""}.
                </p>
              )}
              <p className="opc-help-cms-note">
                The payment will be processed once we&apos;ve received your device.
              </p>
            </div>
          );
        })}

        {/* Reveal the bonus here, not on the product page (see lib/trade-in/bonus.ts). */}
        {bonusTotal === 0 && storeCreditBonus() > 0 && (
          <div>
            <p className="opc-help-cms-item">
              Get an extra bonus of up to <strong>{money(storeCreditBonus())}</strong> per device
            </p>
            <p className="opc-help-cms-note">
              Choose Store Credit instead of a bank transfer or PayPal and we&apos;ll add a bonus
              (20% of the price, up to {money(storeCreditBonus())}) to your payout.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
