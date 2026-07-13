"use client";

/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CheckoutShippingForm from "@/components/checkout/CheckoutShippingForm";
import CheckoutProgressBar from "@/components/checkout/CheckoutProgressBar";
import CheckoutProcessingOverlay from "@/components/checkout/CheckoutProcessingOverlay";
import type { CheckoutAgreementsState } from "@/components/checkout/CheckoutAgreements";
import { useBuyCart } from "@/components/cart/useBuyCart";
import { validateShippingAddress, type ShippingAddress } from "@/lib/checkout/shipping-address";
import { readCheckoutAddress, saveCheckoutAddress } from "@/lib/checkout/saved-address";

type Customer = { id: string; email: string; firstName: string | null; lastName: string | null; phone: string | null };

const money = (v: number) => `£${v.toFixed(2)}`;
const defaultAgreements: CheckoutAgreementsState = { newsletter: false, sms: false, terms: false, recycling: false };

export default function BuyCheckoutPage() {
  const router = useRouter();
  const { items, count, total, clearCart, hydrated } = useBuyCart();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"address" | "payment">("address");
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [agreements, setAgreements] = useState<CheckoutAgreementsState>(defaultAgreements);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<"paypal" | "bank" | "gift_card">("paypal");
  const [storeCredit, setStoreCredit] = useState<number | null>(null);
  const [giftCardCode, setGiftCardCode] = useState("");
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!count) {
      router.replace("/buy-used/checkout/cart");
      return;
    }
    fetch("/api/customer/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.customer) {
          router.replace("/sell-my/customer/account/login?returnUrl=/buy-used/checkout");
          return;
        }
        setCustomer(data.customer);
        // Remembered address (this browser) → skip straight to payment; still changeable.
        const saved = readCheckoutAddress();
        if (saved && !validateShippingAddress(saved)) {
          setShippingAddress(saved);
          setStep("payment");
        }
        fetch("/api/customer/store-credit")
          .then((r) => r.json())
          .then((d) => setStoreCredit(Number(d.balance ?? 0)))
          .catch(() => setStoreCredit(0));
      })
      .finally(() => setLoading(false));
  }, [hydrated, count, router]);

  const creditEnough = (storeCredit ?? 0) + 1e-9 >= total;
  const hasCode = showCode && giftCardCode.trim().length >= 4;

  async function placeOrder() {
    if (!customer || !items.length || !shippingAddress || !agreements.terms) return;
    if (method === "gift_card" && !hasCode && !creditEnough) {
      setError("Enter a gift card code, or your store credit doesn't cover this order.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, shippingAddress, method, giftCardCode: method === "gift_card" && hasCode ? giftCardCode.trim() : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");

      // PayPal: hand off to PayPal for approval (capture happens on return).
      if (data.approveUrl) {
        window.location.href = data.approveUrl;
        return;
      }
      clearCart();
      window.location.href = `/buy-used/checkout/success?ref=${encodeURIComponent(data.orderId)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setSubmitting(false);
    }
  }

  if (loading || !customer) {
    return <div className="container py-12 text-center text-grey-dark">Loading checkout...</div>;
  }

  const formDefaults: Partial<ShippingAddress> = {
    firstName: shippingAddress?.firstName ?? customer.firstName ?? "",
    lastName: shippingAddress?.lastName ?? customer.lastName ?? "",
    street: shippingAddress?.street ?? ["", ""],
    city: shippingAddress?.city ?? "",
    region: shippingAddress?.region ?? "",
    postcode: shippingAddress?.postcode ?? "",
    countryId: shippingAddress?.countryId ?? "GB",
    telephone: shippingAddress?.telephone ?? customer.phone ?? "",
  };

  return (
    <div className="column main">
      <CheckoutProcessingOverlay show={submitting} label={method === "paypal" ? "Redirecting to PayPal…" : "Placing your order…"} />
      <div id="checkout" className="checkout-container">
        <div className="opc-wrapper">
          <CheckoutProgressBar label="Payment" backHref="/buy-used/checkout/cart" />
          <h1>Checkout Securely</h1>

          <ol className="opc" id="checkoutSteps">
            {step === "address" ? (
              <CheckoutShippingForm
                variant="buy"
                initial={formDefaults}
                agreements={agreements}
                onAgreementsChange={setAgreements}
                canCancel={Boolean(shippingAddress)}
                onCancel={() => setStep("payment")}
                onConfirm={(address) => {
                  setShippingAddress(address);
                  saveCheckoutAddress(address);
                  setStep("payment");
                  setError(null);
                }}
              />
            ) : (
              shippingAddress && (
                <li className="checkout-shipping-address">
                  <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Delivery address</h2>
                      <button type="button" onClick={() => setStep("address")} className="text-sm font-medium text-blue hover:underline">Change</button>
                    </div>
                    <address className="text-sm not-italic leading-relaxed text-grey-dark">
                      {shippingAddress.firstName} {shippingAddress.lastName}<br />
                      {shippingAddress.street.filter(Boolean).join(", ")}<br />
                      {shippingAddress.city}{shippingAddress.region ? `, ${shippingAddress.region}` : ""} {shippingAddress.postcode}<br />
                      {shippingAddress.telephone}
                    </address>

                    <h2 className="mt-6 mb-3 text-lg font-semibold">Payment method</h2>
                    <div className="space-y-2.5">
                      {([
                        { key: "paypal", label: "PayPal", note: "Pay securely with your PayPal account.", disabled: false },
                        {
                          key: "gift_card",
                          label: "Store credit / gift card",
                          note:
                            storeCredit == null
                              ? "Checking your balance…"
                              : storeCredit > 0
                                ? `Balance: ${money(storeCredit)} — or enter a code`
                                : "Enter your gift card code",
                          disabled: false,
                        },
                        { key: "bank", label: "Bank transfer", note: "Pay by manual bank transfer; we dispatch once received.", disabled: false },
                      ] as const).map((m) => (
                        <label
                          key={m.key}
                          className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                            m.disabled ? "cursor-not-allowed border-grey-light bg-grey-lightest opacity-60" : "cursor-pointer " + (method === m.key ? "border-blue ring-1 ring-blue" : "border-grey-light hover:border-grey-dark")
                          }`}
                        >
                          <input type="radio" name="pay-method" className="mt-1" checked={method === m.key} disabled={m.disabled} onChange={() => setMethod(m.key)} />
                          <span>
                            <span className="block font-medium text-black">{m.label}</span>
                            <span className="block text-xs text-grey-dark">{m.note}</span>
                          </span>
                        </label>
                      ))}
                    </div>

                    {method === "gift_card" && (
                      <div className="mt-3">
                        {!showCode ? (
                          <button type="button" onClick={() => setShowCode(true)} className="text-sm font-medium text-blue hover:underline">
                            Have a gift card code?
                          </button>
                        ) : (
                          <>
                            <input
                              className="w-full rounded-lg border border-grey-light px-3 py-2.5 text-sm uppercase tracking-wide outline-none focus:border-black"
                              placeholder="Gift card code"
                              value={giftCardCode}
                              onChange={(e) => setGiftCardCode(e.target.value)}
                              autoComplete="off"
                              spellCheck={false}
                            />
                            <p className="mt-1 text-xs text-grey-dark">
                              For a gift card that isn&apos;t linked to your account. Leave blank to use your £{(storeCredit ?? 0).toFixed(2)} balance.
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    <label className="mt-5 flex items-start gap-2 text-sm">
                      <input type="checkbox" className="mt-0.5" checked={agreements.terms} onChange={(e) => setAgreements({ ...agreements, terms: e.target.checked })} />
                      <span>I have read and accept the terms and conditions.</span>
                    </label>

                    {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                    <button
                      type="button"
                      onClick={placeOrder}
                      disabled={submitting || !agreements.terms}
                      className="btn btn-primary mt-5 w-full disabled:opacity-50"
                    >
                      {submitting
                        ? "Processing…"
                        : method === "paypal"
                          ? `Pay with PayPal · ${money(total)}`
                          : method === "gift_card"
                            ? `Pay with Store Credit · ${money(total)}`
                            : `Place Order · ${money(total)}`}
                    </button>
                  </div>
                </li>
              )
            )}
          </ol>
        </div>

        {/* Order summary */}
        <div id="opc-sidebar" className="opc-sidebar">
          <div className="opc-block-summary">
            <span className="title">Summary</span>
          </div>
          <div className="opc-help-cms">
            {items.map((item) => (
              <div key={item.id} className="mb-3 flex items-center gap-3 border-b border-grey-light pb-3">
                <img src={item.image} alt="" className="h-12 w-12 shrink-0 object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-black">{item.productName}</p>
                  <p className="text-xs text-grey-dark">{[item.colour, item.grade, item.storage].filter(Boolean).join(" · ")}{item.quantity > 1 ? ` ×${item.quantity}` : ""}</p>
                </div>
                <span className="text-sm font-medium">{money(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm text-grey-dark"><span>Delivery</span><span>Free</span></div>
            <div className="mt-2 flex items-center justify-between text-base font-semibold text-black"><span>Order Total</span><span>{money(total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
