"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import type { SellProductDetail } from "@/data/types";
import ConditionDetails from "@/components/catalog/ConditionDetails";
import { STORE_CREDIT_METHOD } from "@/lib/trade-in/bonus";
type Props = {
  product: SellProductDetail;
};

type Condition = "Fully Working" | "Faulty" | "No Power";
type ReturnPack = "Yes" | "No";
type PaymentMethod = "Bank Transfer" | "Paypal" | typeof STORE_CREDIT_METHOD;

function formatGbp(amount: number) {
  return `£${amount.toFixed(2)}`;
}

function PriceDisplay({ amount }: { amount: number }) {
  return (
    <div className="flex flex-col text-grey-dark text-sm w-full md:flex md:border border-green-darker md:bg-green-light md:flex-row md:items-center rounded-lg md:py-3 md:px-4 md:max-w-[240px] md:mx-auto md:mt-4 justify-between">
      <span className="pr-4">We&apos;ll pay you</span>
      <span className="text-green-darker text-2xl font-medium">{formatGbp(amount)}</span>
    </div>
  );
}

function OptionRadio({
  name,
  value,
  label,
  selected,
  onChange,
  variant = "default",
}: {
  name: string;
  value: string;
  label: string;
  selected: boolean;
  onChange: (value: string) => void;
  variant?: "default" | "condition";
}) {
  const id = `${name}-${value.replace(/\s+/g, "-").toLowerCase()}`;
  const selectedClass =
    variant === "condition"
      ? "border-blue bg-blue-light text-blue"
      : "border-green-darker bg-green-light";
  return (
    <div className="field choice p-1 w-1/2 md:w-1/4 md:flex-grow m-0">
      <input
        type="radio"
        className="form-radio product-custom-option sr-only"
        name={name}
        id={id}
        value={value}
        checked={selected}
        onChange={() => onChange(value)}
      />
      <label
        className={`block border text-center text-grey-dark p-3 rounded-lg w-full h-full relative group label cursor-pointer text-sm ${
          selected ? selectedClass : "border-grey"
        }`}
        htmlFor={id}
      >
        <span>{label}</span>
      </label>
    </div>
  );
}

export default function SellProductDetail({ product }: Props) {
  const { addItem, openDrawer } = useCart();
  const priceWorking = product.priceWorking ?? 20;
  const priceFaulty = product.priceFaulty ?? 5;
  const priceNoPower = product.priceNoPower ?? 0;

  const [condition, setCondition] = useState<Condition | "">("");
  const [returnPack, setReturnPack] = useState<ReturnPack | "">("");
  const [payment, setPayment] = useState<PaymentMethod | "">("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [accountName, setAccountName] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [qty, setQty] = useState(1);
  const [imei, setImei] = useState("");
  const [confirmAccount, setConfirmAccount] = useState(false);
  const [confirmUnlocked, setConfirmUnlocked] = useState(false);
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const unitPrice = useMemo(() => {
    if (condition === "Fully Working") return priceWorking;
    if (condition === "Faulty") return priceFaulty;
    if (condition === "No Power") return priceNoPower;
    return priceWorking;
  }, [condition, priceWorking, priceFaulty, priceNoPower]);

  const totalPrice = unitPrice * qty;
  const payoutValid =
    payment === "Bank Transfer"
      ? accountName.trim().length > 0 && sortCode.trim().length > 0 && accountNumber.trim().length > 0
      : payment === "Paypal"
        ? paypalEmail.trim().length > 0
        : // Store credit needs no payout details — the gift card code is emailed.
          payment === STORE_CREDIT_METHOD;
  const canSubmit =
    condition !== "" &&
    returnPack !== "" &&
    payment !== "" &&
    customerEmail.trim().length > 0 &&
    payoutValid &&
    confirmAccount &&
    confirmUnlocked &&
    confirmPayment &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const slug = product.href.replace("/sell-my/", "");
      addItem({
        id: crypto.randomUUID(),
        productName: product.name,
        productSlug: slug,
        productHref: product.href,
        image: product.image,
        shopifyProductId: product.shopifyProductId,
        shopifyVariantId: product.shopifyVariantId,
        condition,
        returnPack,
        paymentMethod: payment,
        quantity: qty,
        unitPrice,
        imei: imei || undefined,
        customerEmail: customerEmail.trim(),
        customerName: payment === "Bank Transfer" ? accountName.trim() : undefined,
        payoutDetails:
          payment === "Bank Transfer"
            ? {
                accountName: accountName.trim(),
                sortCode: sortCode.trim(),
                accountNumber: accountNumber.trim(),
              }
            : payment === "Paypal"
              ? { paypalEmail: paypalEmail.trim() }
              : {},
        confirmAccount,
        confirmUnlocked,
        confirmPayment,
      });

      openDrawer();
    } catch (err) {
      setSubmitMessage(err instanceof Error ? err.message : "Could not add to basket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="product-info-main">
      <section className="text-gray-700 body-font">
        <div className="flex flex-col items-stretch">
          <div className="block md:grid md:grid-cols-virtual md:grid-rows-2-auto order-first w-full mb-6 md:mb-0">
            <div className="order-1 md:pl-5 lg:pl-10 mb-4 md:mb-0 md:row-start-1 md:row-end-1 md:col-start-2">
              <div className="mb-4 text-center md:text-left">
                <h1 className="text-xl mb-1 md:text-3xl font-medium text-black title-font">
                  <span className="base">{product.name}</span>
                </h1>
              </div>
            </div>

            <div className="order-2 md:row-start-1 md:row-end-3 md:col-start-1 mb-5 md:mb-0 relative">
              <div className="sticky top-4">
                <picture className="block mx-auto w-full max-w-[105px] md:max-w-none">
                  <img
                    alt="main product photo"
                    title={product.name}
                    className="block mx-auto w-full max-w-[105px] md:max-w-none"
                    loading="lazy"
                    src={product.image}
                    width={700}
                    height={700}
                  />
                </picture>
                <div className="hidden md:block">
                  <PriceDisplay amount={totalPrice} />
                </div>
              </div>
            </div>

            <div className="order-3 md:pl-5 lg:pl-10 md:pt-6 md:mb-0">
              <form className="my-6 md:mt-0" id="product_addtocart_form" onSubmit={handleSubmit}>
                <div className="product-options-wrapper" id="product-options-wrapper">
                  <div className="fieldset" tabIndex={0}>
                    <div className="mb-6 flex flex-wrap -mx-1">
                      <div className="flex flex-col mb-4 w-full items-center px-1" data-option-key="condition">
                        <label className="label font-medium text-gray-700 text-left w-full">
                          <span>Condition</span>
                          <span className="sup text-sm">*</span>
                        </label>
                        <div className="text-gray-900 text-left w-full">
                          <div className="options-list nested flex flex-wrap -mx-1 options-radio">
                            <OptionRadio
                              name="condition"
                              value="Fully Working"
                              label="Fully Working"
                              selected={condition === "Fully Working"}
                              onChange={(v) => setCondition(v as Condition)}
                              variant="condition"
                            />
                            {priceNoPower > 0 && (
                              <OptionRadio
                                name="condition"
                                value="No Power"
                                label="No Power"
                                selected={condition === "No Power"}
                                onChange={(v) => setCondition(v as Condition)}
                                variant="condition"
                              />
                            )}
                            <OptionRadio
                              name="condition"
                              value="Faulty"
                              label="Faulty"
                              selected={condition === "Faulty"}
                              onChange={(v) => setCondition(v as Condition)}
                              variant="condition"
                            />
                          </div>
                          <ConditionDetails condition={condition} />
                        </div>
                      </div>

                      <div className="flex flex-col mb-4 w-full items-center px-1" data-option-key="imei-serial-number">
                        <label className="label font-medium text-gray-700 text-left w-full" htmlFor="imei-serial">
                          <span>IMEI / Serial Number</span>
                          <span> (Optional)</span>
                          <button
                            type="button"
                            className="bg-blue rounded-full w-4 h-4 text-white text-base ml-2 leading-4"
                            aria-label="IMEI help"
                          >
                            ?
                          </button>
                        </label>
                        <div className="text-gray-900 text-left w-full">
                          <input
                            type="text"
                            id="imei-serial"
                            className="product-custom-option form-input w-full"
                            value={imei}
                            onChange={(e) => setImei(e.target.value.replace(/[^a-zA-Z0-9.,]/g, ""))}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col mb-4 w-full items-center px-1" data-option-key="return-pack">
                        <label className="label font-medium text-gray-700 text-left w-full">
                          <span>Do you require a free return pack?</span>
                          <span className="sup text-sm">*</span>
                        </label>
                        <div className="text-gray-900 text-left w-full">
                          <div className="options-list nested flex flex-wrap -mx-1 options-radio">
                            <OptionRadio
                              name="return-pack"
                              value="Yes"
                              label="Yes"
                              selected={returnPack === "Yes"}
                              onChange={(v) => setReturnPack(v as ReturnPack)}
                            />
                            <OptionRadio
                              name="return-pack"
                              value="No"
                              label="No"
                              selected={returnPack === "No"}
                              onChange={(v) => setReturnPack(v as ReturnPack)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col mb-4 w-full items-center px-1" data-option-key="payment">
                        <label className="label font-medium text-gray-700 text-left w-full">
                          <span>How do you want to get paid?</span>
                          <span className="sup text-sm">*</span>
                        </label>
                        <div className="text-gray-900 text-left w-full">
                          <div className="options-list nested flex flex-wrap -mx-1 options-radio">
                            <OptionRadio
                              name="payment"
                              value="Bank Transfer"
                              label="Bank Transfer"
                              selected={payment === "Bank Transfer"}
                              onChange={(v) => setPayment(v as PaymentMethod)}
                            />
                            <OptionRadio
                              name="payment"
                              value="Paypal"
                              label="Paypal"
                              selected={payment === "Paypal"}
                              onChange={(v) => setPayment(v as PaymentMethod)}
                            />
                            <OptionRadio
                              name="payment"
                              value={STORE_CREDIT_METHOD}
                              label="Store Credit"
                              selected={payment === STORE_CREDIT_METHOD}
                              onChange={(v) => setPayment(v as PaymentMethod)}
                            />
                          </div>
                          {/* The bonus itself is revealed at checkout, not here. */}
                          <p className="mt-1 px-1 text-sm text-green">
                            Choose Store Credit and we&apos;ll add a bonus to your payout.
                          </p>
                        </div>
                      </div>

                      {payment === "Bank Transfer" && (
                        <>
                          <div className="flex flex-col mb-4 w-full items-center px-1">
                            <label className="label font-medium text-gray-700 text-left w-full" htmlFor="account-name">
                              <span>Full name</span>
                              <span className="sup text-sm">*</span>
                            </label>
                            <input
                              type="text"
                              id="account-name"
                              className="product-custom-option form-input w-full"
                              value={accountName}
                              onChange={(e) => setAccountName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="flex flex-col mb-4 w-full items-center px-1">
                            <label className="label font-medium text-gray-700 text-left w-full" htmlFor="sort-code">
                              <span>Sort Code</span>
                              <span className="sup text-sm">*</span>
                            </label>
                            <input
                              type="text"
                              id="sort-code"
                              className="product-custom-option form-input w-full"
                              value={sortCode}
                              onChange={(e) => setSortCode(e.target.value.replace(/[^\d-]/g, ""))}
                              required
                            />
                          </div>
                          <div className="flex flex-col mb-4 w-full items-center px-1">
                            <label className="label font-medium text-gray-700 text-left w-full" htmlFor="account-number">
                              <span>Account number</span>
                              <span className="sup text-sm">*</span>
                            </label>
                            <input
                              type="text"
                              id="account-number"
                              className="product-custom-option form-input w-full"
                              value={accountNumber}
                              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                              required
                            />
                          </div>
                        </>
                      )}

                      {payment === "Paypal" && (
                        <div className="flex flex-col mb-4 w-full items-center px-1">
                          <label className="label font-medium text-gray-700 text-left w-full" htmlFor="paypal-email">
                            <span>Paypal Email Address</span>
                            <span className="sup text-sm">*</span>
                          </label>
                          <input
                            type="email"
                            id="paypal-email"
                            className="product-custom-option form-input w-full"
                            value={paypalEmail}
                            onChange={(e) => setPaypalEmail(e.target.value)}
                            required
                          />
                        </div>
                      )}

                      <div className="flex flex-col mb-4 w-full items-center px-1">
                        <label className="label font-medium text-gray-700 text-left w-full" htmlFor="customer-email">
                          <span>Your email address</span>
                          <span className="sup text-sm">*</span>
                        </label>
                        <input
                          type="email"
                          id="customer-email"
                          className="product-custom-option form-input w-full"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="mb-4 text-sm rounded-lg py-2 px-4 flex items-center text-blue w-full bg-blue-light">
                        <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-transparent fill-current w-3 h-4 mr-2">
                          <path d="M4.25 10C4.25 10.4142 4.58579 10.75 5 10.75C5.41421 10.75 5.75 10.4142 5.75 10H4.25ZM5 6H4.25H5ZM10 1V0.25V1ZM14.25 10C14.25 10.4142 14.5858 10.75 15 10.75C15.4142 10.75 15.75 10.4142 15.75 10H14.25ZM3 10.75H17V9.25H3V10.75ZM17 10.75C17.6904 10.75 18.25 11.3096 18.25 12H19.75C19.75 10.4812 18.5188 9.25 17 9.25V10.75ZM18.25 12V19H19.75V12H18.25ZM18.25 19C18.25 19.6904 17.6904 20.25 17 20.25V21.75C18.5188 21.75 19.75 20.5188 19.75 19H18.25ZM17 20.25H3V21.75H17V20.25ZM3 20.25C2.30964 20.25 1.75 19.6904 1.75 19H0.25C0.25 20.5188 1.48122 21.75 3 21.75V20.25ZM1.75 19V12H0.25V19H1.75ZM1.75 12C1.75 11.3096 2.30964 10.75 3 10.75V9.25C1.48122 9.25 0.25 10.4812 0.25 12H1.75ZM5.75 10V6H4.25V10H5.75ZM5.75 6C5.75 4.87283 6.19777 3.79183 6.9948 2.9948L5.93414 1.93414C4.8558 3.01247 4.25 4.47501 4.25 6H5.75ZM6.9948 2.9948C7.79183 2.19777 8.87283 1.75 10 1.75V0.25C8.47501 0.25 7.01247 0.855802 5.93414 1.93414L6.9948 2.9948ZM10 1.75C11.1272 1.75 12.2082 2.19777 13.0052 2.9948L14.0659 1.93414C12.9875 0.855802 11.525 0.25 10 0.25V1.75ZM13.0052 2.9948C13.8022 3.79183 14.25 4.87283 14.25 6H15.75C15.75 4.47501 15.1442 3.01247 14.0659 1.93414L13.0052 2.9948ZM14.25 6V10H15.75V6H14.25Z" />
                        </svg>
                        Your details will be stored securely
                      </div>

                      <div className="flex flex-col mb-4 w-full items-center px-1 bg-grey-lightest !p-4 rounded-lg" data-option-key="confirm">
                        <div className="flex text-xs border-b border-grey-light pb-4 mb-4 relative w-full">
                          <div className="w-8 min-h-1 mt-0.5" />
                          <div className="ml-4 basis-0 flex-grow trade-in-terms">
                            <p>
                              <strong>
                                <img src="/images/option-confirm.png" alt="" />
                              </strong>
                            </p>
                            <p>
                              <strong>IMPORTANT</strong>: Please remove your Account lock before posting as we will be unable to process any devices which are still linked to an account. If you fail to remove the lock your payment will be delayed.
                              <br />
                              Please refer to the{" "}
                              <a tabIndex={0} href="https://www.4gadgets.co.uk/">
                                Activation Lock Removal Guide
                              </a>
                            </p>
                          </div>
                        </div>

                        <div className="text-gray-900 text-left w-full">
                          <div className="options-list nested block space-y-4 options-checkbox">
                            {[
                              { id: "confirm-account", label: "I have unlinked My iCloud / Google Account", checked: confirmAccount, onChange: setConfirmAccount },
                              { id: "confirm-unlocked", label: "My phone is unlocked", checked: confirmUnlocked, onChange: setConfirmUnlocked },
                              { id: "confirm-payment", label: "I accept liability for incorrect payment details", checked: confirmPayment, onChange: setConfirmPayment },
                            ].map((item) => (
                              <div key={item.id} className="field choice block">
                                <input
                                  type="checkbox"
                                  className="form-checkbox product-custom-option"
                                  id={item.id}
                                  checked={item.checked}
                                  onChange={(e) => item.onChange(e.target.checked)}
                                />
                                <label className="block" htmlFor={item.id}>
                                  <span>{item.label}</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>

              <div className="flex items-center -mx-1">
                <div
                  id="product-addto-wrap"
                  className="flex items-end md:my-4 md:ml-auto fixed md:static bottom-0 left-0 w-full p-4 md:px-1 md:py-0 bg-white md:bg-transparent z-20 md:z-auto border-t border-grey md:border-none"
                >
                  <div className="w-1/2">
                    <div className="flex flex-col text-grey-dark text-sm w-full">
                      <span className="pr-4">We&apos;ll pay you</span>
                      <span className="text-green-darker text-2xl font-medium">{formatGbp(totalPrice)}</span>
                    </div>
                  </div>

                  <div className="flex ml-auto md:w-2/3">
                    <div className="mr-2 h-full flex items-center">
                      <label htmlFor="qty" className="mr-2 hidden md:block">
                        Qty
                      </label>
                      <input
                        name="qty"
                        id="qty"
                        form="product_addtocart_form"
                        type="number"
                        min={1}
                        max={10000}
                        value={qty}
                        onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                        className="form-input px-2 py-2 w-20 h-full text-center"
                      />
                    </div>
                    <button
                      type="submit"
                      form="product_addtocart_form"
                      title="Sell My Device"
                      className={`btn btn-primary md:w-full ${!canSubmit ? "disabled opacity-50" : ""}`}
                      id="product-addtocart-button"
                      disabled={!canSubmit}
                    >
                      <span>{submitting ? "Adding..." : "Add to Basket"}</span>
                    </button>
                  </div>
                </div>
              </div>
              {submitMessage && (
                <p className="mt-4 text-sm text-center text-grey-dark px-4">{submitMessage}</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
