"use client";

export type CheckoutAgreementsState = {
  newsletter: boolean;
  sms: boolean;
  terms: boolean;
  recycling: boolean;
};

type Props = {
  value: CheckoutAgreementsState;
  onChange: (value: CheckoutAgreementsState) => void;
  /** "buy" hides the trade-in-only agreements (SMS + device recycling). */
  variant?: "sell" | "buy";
};

export function allAgreementsChecked(value: CheckoutAgreementsState) {
  return value.newsletter && value.sms && value.terms && value.recycling;
}

export function requiredAgreementsChecked(value: CheckoutAgreementsState, variant: "sell" | "buy" = "sell") {
  return variant === "buy" ? value.terms : value.terms && value.recycling;
}

export default function CheckoutAgreements({ value, onChange, variant = "sell" }: Props) {
  function update(patch: Partial<CheckoutAgreementsState>) {
    onChange({ ...value, ...patch });
  }
  const isBuy = variant === "buy";

  return (
    <div className="checkout-agreements-block">
      <div data-role="subscribe">
        <div className="subscribe fieldset">
          <input
            type="checkbox"
            id="subscribeToggle_free"
            name="subscribe"
            checked={value.newsletter}
            onChange={(e) => update({ newsletter: e.target.checked })}
          />
          <label className="label" htmlFor="subscribeToggle_free">
            <span>Subscribe to our newsletter for the latest deals and updates</span>
          </label>
        </div>
      </div>

      {!isBuy && (
        <div className="choice field">
          <input
            type="checkbox"
            className="checkbox"
            id="sms-consent"
            name="sms_consent"
            checked={value.sms}
            onChange={(e) => update({ sms: e.target.checked })}
          />
          <label className="label" htmlFor="sms-consent">
            <span>
              Subscribe to SMS to receive marketing text messages for promotions and basket
              reminders
            </span>
          </label>
        </div>
      )}

      <div data-role="checkout-agreements">
        <div className="checkout-agreements fieldset">
          <div className="checkout-agreement field choice required">
            <input
              type="checkbox"
              className="required-entry"
              id="agreement_free_3"
              name="agreement[3]"
              value="3"
              checked={value.terms}
              onChange={(e) => update({ terms: e.target.checked })}
            />
            <label className="label" htmlFor="agreement_free_3">
              <span>I have read and accepted the terms and conditions</span>
            </label>
          </div>

          {!isBuy && (
            <div className="checkout-agreement field choice required">
              <input
                type="checkbox"
                className="required-entry"
                id="agreement_free_4"
                name="agreement[4]"
                value="4"
                checked={value.recycling}
                onChange={(e) => update({ recycling: e.target.checked })}
              />
              <label className="label" htmlFor="agreement_free_4">
                <span>
                  I agree that all boxes, chargers and accessories sent in will be recycled - they
                  do not increase the estimated price and we cannot return them under any
                  circumstances.
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
