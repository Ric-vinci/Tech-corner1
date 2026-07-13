"use client";

import { useId, useState } from "react";
import CheckoutAgreements, { type CheckoutAgreementsState } from "@/components/checkout/CheckoutAgreements";
import type { ShippingAddress } from "@/lib/checkout/shipping-address";
import { normalizeShippingAddress, validateShippingAddress } from "@/lib/checkout/shipping-address";

type Props = {
  initial: Partial<ShippingAddress>;
  agreements: CheckoutAgreementsState;
  onAgreementsChange: (value: CheckoutAgreementsState) => void;
  onConfirm: (address: ShippingAddress) => void;
  /** Mirrors the reference's canUseCancelBillingAddress(): only offered when
   *  an address was already confirmed (i.e. arrived via "Change Address"). */
  canCancel?: boolean;
  onCancel?: () => void;
  variant?: "sell" | "buy";
};

function ManualEntryChevron() {
  return (
    <svg viewBox="0 0 305.67 179.25" aria-hidden="true">
      <rect
        x="-22.85"
        y="66.4"
        width="226.32"
        height="47.53"
        rx="17.33"
        ry="17.33"
        transform="translate(89.52 -37.99) rotate(45)"
      />
      <rect
        x="103.58"
        y="66.4"
        width="226.32"
        height="47.53"
        rx="17.33"
        ry="17.33"
        transform="translate(433.06 0.12) rotate(135)"
      />
    </svg>
  );
}

function inputClass(value: string) {
  return `input-text form-input w-full${value.trim() ? " valid" : ""}`;
}

function selectClass(value: string) {
  return `select form-select w-full${value.trim() ? " valid" : ""}`;
}

function hiddenWhenCollapsed(manualEntry: boolean) {
  return manualEntry ? "" : " cc_hide cc_hidden";
}

export default function CheckoutShippingForm({
  initial,
  agreements,
  onAgreementsChange,
  onConfirm,
  canCancel = false,
  onCancel,
  variant = "sell",
}: Props) {
  const uid = useId();
  const [firstName, setFirstName] = useState(initial.firstName ?? "");
  const [lastName, setLastName] = useState(initial.lastName ?? "");
  const [company, setCompany] = useState(initial.company ?? "");
  const [addressSearch, setAddressSearch] = useState("");
  const [manualEntry, setManualEntry] = useState(
    Boolean(initial.street?.[0] || initial.city || initial.postcode)
  );
  const [street0, setStreet0] = useState(initial.street?.[0] ?? "");
  const [street1, setStreet1] = useState(initial.street?.[1] ?? "");
  const [countryId, setCountryId] = useState(initial.countryId ?? "GB");
  const [region, setRegion] = useState(initial.region ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [postcode, setPostcode] = useState(initial.postcode ?? "");
  const [telephone, setTelephone] = useState(initial.telephone ?? "");
  const [error, setError] = useState<string | null>(null);

  const manualHidden = hiddenWhenCollapsed(manualEntry);

  function handleConfirm() {
    if (!manualEntry && !street0.trim()) {
      setManualEntry(true);
      setError("Please enter your address manually.");
      return;
    }

    const candidate = normalizeShippingAddress({
      firstName,
      lastName,
      company,
      street: [street0, street1],
      city,
      region,
      postcode,
      countryId,
      telephone,
    });

    const validationError = validateShippingAddress(candidate);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onConfirm(candidate);
    // Advancing to the next step swaps in shorter content; jump back to the top
    // so the customer isn't left staring at the footer.
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <li id="payment" role="presentation" className="checkout-payment-method">
      <div id="checkout-step-payment" className="step-content" role="tabpanel" aria-hidden="false">
        <div className="checkout-billing-address">
          <div className="billing-address-form">
            <form
              data-hasrequired="* Required Fields"
              data-cc_hidden="1"
              onSubmit={(e) => e.preventDefault()}
            >
              <fieldset className="fieldset address" data-form="billing-new-address">
                <div className="field _required" data-name="billingAddressfree.firstname">
                  <label className="label" htmlFor={`${uid}-firstname`}>
                    <span>First Name</span>
                  </label>
                  <div className="control">
                    <input
                      id={`${uid}-firstname`}
                      className={inputClass(firstName)}
                      type="text"
                      name="firstname"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      aria-required="true"
                      required
                    />
                  </div>
                </div>

                <div className="field _required" data-name="billingAddressfree.lastname">
                  <label className="label" htmlFor={`${uid}-lastname`}>
                    <span>Last Name</span>
                  </label>
                  <div className="control">
                    <input
                      id={`${uid}-lastname`}
                      className={inputClass(lastName)}
                      type="text"
                      name="lastname"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      aria-required="true"
                      required
                    />
                  </div>
                </div>

                <div className="field" data-name="billingAddressfree.company">
                  <label className="label" htmlFor={`${uid}-company`}>
                    <span>Company</span>
                  </label>
                  <div className="control">
                    <input
                      id={`${uid}-company`}
                      className={inputClass(company)}
                      type="text"
                      name="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="label" htmlFor="fetchify_search">
                    Address Search
                  </label>
                  <div className="control">
                    <input
                      id="fetchify_search"
                      className="cc_search_input"
                      name="fetchify_search"
                      type="text"
                      placeholder="Enter postcode or street"
                      role="searchbox"
                      aria-autocomplete="list"
                      aria-expanded="false"
                      autoComplete="new-crafty-global-search"
                      value={addressSearch}
                      onChange={(e) => setAddressSearch(e.target.value)}
                    />
                  </div>
                  <div className="cp_manual_entry">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => setManualEntry((v) => !v)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setManualEntry((v) => !v);
                        }
                      }}
                    >
                      Enter address manually
                      <ManualEntryChevron />
                    </span>
                  </div>
                </div>

                <fieldset
                  className={`field street admin__control-fields required${manualHidden}`}
                >
                  <legend className="label">
                    <span>Street Address</span>
                  </legend>
                  <div className="control">
                    <div className="field _required" data-name="billingAddressfree.street.0">
                      <label className="label" htmlFor={`${uid}-street-0`}>
                        <span>Street Address: Line 1</span>
                      </label>
                      <div className="control">
                        <input
                          id={`${uid}-street-0`}
                          className={inputClass(street0)}
                          type="text"
                          name="street[0]"
                          value={street0}
                          onChange={(e) => setStreet0(e.target.value)}
                          aria-required="true"
                          required={manualEntry}
                        />
                      </div>
                    </div>

                    <div
                      className={`field additional${manualHidden}`}
                      data-name="billingAddressfree.street.1"
                    >
                      <label className="label" htmlFor={`${uid}-street-1`}>
                        <span>Street Address: Line 2</span>
                      </label>
                      <div className="control">
                        <input
                          id={`${uid}-street-1`}
                          className={inputClass(street1)}
                          type="text"
                          name="street[1]"
                          value={street1}
                          onChange={(e) => setStreet1(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </fieldset>

                <div
                  className={`field _required${manualHidden}`}
                  data-name="billingAddressfree.country_id"
                >
                  <label className="label" htmlFor={`${uid}-country`}>
                    <span>Country</span>
                  </label>
                  <div className="control">
                    <select
                      id={`${uid}-country`}
                      className={selectClass(countryId)}
                      name="country_id"
                      value={countryId}
                      onChange={(e) => setCountryId(e.target.value)}
                      aria-required="true"
                      required={manualEntry}
                    >
                      <option value="GB">United Kingdom</option>
                      <option value="IE">Ireland</option>
                    </select>
                  </div>
                </div>

                <div className={`field${manualHidden}`} data-name="billingAddressfree.region">
                  <label className="label" htmlFor={`${uid}-region`}>
                    <span>State/Province</span>
                  </label>
                  <div className="control">
                    <input
                      id={`${uid}-region`}
                      className={inputClass(region)}
                      type="text"
                      name="region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                    />
                  </div>
                </div>

                <div className={`field _required${manualHidden}`} data-name="billingAddressfree.city">
                  <label className="label" htmlFor={`${uid}-city`}>
                    <span>City</span>
                  </label>
                  <div className="control">
                    <input
                      id={`${uid}-city`}
                      className={inputClass(city)}
                      type="text"
                      name="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      aria-required="true"
                      required={manualEntry}
                    />
                  </div>
                </div>

                <div
                  className={`field _required${manualHidden}`}
                  data-name="billingAddressfree.postcode"
                >
                  <label className="label" htmlFor={`${uid}-postcode`}>
                    <span>Zip/Postal Code</span>
                  </label>
                  <div className="control">
                    <input
                      id={`${uid}-postcode`}
                      className={inputClass(postcode)}
                      type="text"
                      name="postcode"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      aria-required="true"
                      data-cc_attach="1"
                      required={manualEntry}
                    />
                  </div>
                </div>

                <div className="field _required" data-name="billingAddressfree.telephone">
                  <label className="label" htmlFor={`${uid}-telephone`}>
                    <span>Phone Number</span>
                  </label>
                  <div className="control _with-tooltip">
                    <div className="iti iti--allow-dropdown">
                      <div className="iti__flag-container">
                        <div
                          className="iti__selected-flag"
                          title="United Kingdom: +44"
                          aria-label="United Kingdom country code +44"
                        >
                          <div className="iti__flag iti__gb" />
                          <div className="iti__arrow" />
                        </div>
                      </div>
                      <input
                        id={`${uid}-telephone`}
                        className="input-text ddg-telephone-input"
                        type="text"
                        name="telephone"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        aria-describedby={`notice-${uid}-telephone`}
                        autoComplete="off"
                        placeholder="+44 7400 123456"
                        required
                      />
                    </div>

                    <div className="field-tooltip toggle" aria-hidden="true">
                      <span className="label" id={`tooltip-${uid}-telephone`}>
                        <span>Tooltip</span>
                      </span>
                      <span className="field-tooltip-action action-help" tabIndex={-1} />
                      <div className="field-tooltip-content" id={`notice-${uid}-telephone`}>
                        For SMS order notifications.
                      </div>
                    </div>
                  </div>
                </div>
              </fieldset>
            </form>
          </div>

          {error && (
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </p>
          )}

          <div className="actions-toolbar">
            <div className="primary">
              <button
                type="button"
                className="action action-update primary btn btn-primary"
                onClick={handleConfirm}
              >
                <span>Confirm Address</span>
              </button>
              {canCancel && onCancel && (
                <button type="button" className="action action-cancel" onClick={onCancel}>
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <CheckoutAgreements value={agreements} onChange={onAgreementsChange} variant={variant} />

      {variant === "sell" && (
        <div className="actions-toolbar">
          <div className="primary">
            <button
              type="button"
              className="action primary checkout btn btn-primary btn__trade-in btn__trade-in--idle"
              disabled
              aria-disabled="true"
            >
              <span>Trade In</span>
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
