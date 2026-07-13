"use client";

import CheckoutAgreements, {
  type CheckoutAgreementsState,
  requiredAgreementsChecked,
} from "@/components/checkout/CheckoutAgreements";
import type { ShippingAddress } from "@/lib/checkout/shipping-address";

type Props = {
  address: ShippingAddress;
  agreements: CheckoutAgreementsState;
  onAgreementsChange: (value: CheckoutAgreementsState) => void;
  onChangeAddress: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
};

export default function CheckoutConfirmedAddress({
  address,
  agreements,
  onAgreementsChange,
  onChangeAddress,
  onSubmit,
  submitting,
  error,
}: Props) {
  const street = address.street.filter(Boolean).join(", ");
  const canTradeIn = requiredAgreementsChecked(agreements) && !submitting;

  return (
    <li id="payment" role="presentation" className="checkout-payment-method">
      <div id="checkout-step-payment" className="step-content checkout-step-confirmed" role="tabpanel" aria-hidden="false">
        <div className="payment-method _active">
          <div className="payment-method-content">
            <div className="payment-method-billing-address">
              <div className="checkout-billing-address">
                <div className="billing-address-details">
                  <div className="your-address-title">
                    <span>Your Address</span>
                  </div>
                  {address.firstName} {address.lastName}
                  <br />
                  {street}
                  <br />
                  {address.city}
                  {address.region ? (
                    <>
                      , <span>{address.region}</span>
                    </>
                  ) : null}{" "}
                  {address.postcode}
                  <br />
                  {address.countryName}
                  <br />
                  <a href={`tel:${address.telephone}`}>{address.telephone}</a>
                  <br />

                  <div className="actions-toolbar">
                    <button
                      type="button"
                      className="action action-edit-address primary"
                      onClick={onChangeAddress}
                    >
                      <span>Change Address</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agreements + Trade In sit below the card in normal flow, mirroring the
          address step (and the reference), rather than being absolutely placed. */}
      <CheckoutAgreements value={agreements} onChange={onAgreementsChange} />

      {error && <p className="message message-error error">{error}</p>}

      <div className="actions-toolbar">
        <div className="primary">
          <button
            type="button"
            className={`action primary checkout btn__trade-in${canTradeIn ? "" : " btn__trade-in--idle"}`}
            disabled={!canTradeIn}
            onClick={onSubmit}
          >
            <span>{submitting ? "Submitting..." : "Trade In"}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
