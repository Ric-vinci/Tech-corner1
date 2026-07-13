"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CheckoutAgreementsState } from "@/components/checkout/CheckoutAgreements";
import { requiredAgreementsChecked } from "@/components/checkout/CheckoutAgreements";
import CheckoutConfirmedAddress from "@/components/checkout/CheckoutConfirmedAddress";
import CheckoutOrderSummary from "@/components/checkout/CheckoutOrderSummary";
import CheckoutProgressBar from "@/components/checkout/CheckoutProgressBar";
import CheckoutProcessingOverlay from "@/components/checkout/CheckoutProcessingOverlay";
import CheckoutShippingForm from "@/components/checkout/CheckoutShippingForm";
import { useCart } from "@/components/cart/CartProvider";
import { validateShippingAddress, type ShippingAddress } from "@/lib/checkout/shipping-address";
import { readCheckoutAddress, saveCheckoutAddress } from "@/lib/checkout/saved-address";

type Customer = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
};

type CheckoutStep = "address" | "confirmed";

const defaultAgreements: CheckoutAgreementsState = {
  newsletter: false,
  sms: false,
  terms: false,
  recycling: false,
};

export default function CheckoutSecurelyPage() {
  const router = useRouter();
  const { items, count, clearCart } = useCart();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<CheckoutStep>("address");
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [agreements, setAgreements] = useState<CheckoutAgreementsState>(defaultAgreements);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set once we start placing the order, so clearing the cart (count → 0) does
  // not bounce us to the empty basket page before the success page loads.
  const placingOrder = useRef(false);

  useEffect(() => {
    if (!count) {
      if (!placingOrder.current) router.replace("/sell-my/checkout/cart");
      return;
    }

    fetch("/api/customer/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.customer) {
          router.replace("/sell-my/customer/account/login?returnUrl=/sell-my/checkout");
          return;
        }
        setCustomer(data.customer);
        // Remembered address (this browser) → show it pre-confirmed; still changeable.
        const saved = readCheckoutAddress();
        if (saved && !validateShippingAddress(saved)) {
          setShippingAddress(saved);
          setStep("confirmed");
        }
      })
      .finally(() => setLoading(false));
  }, [count, router]);

  async function handleTradeIn() {
    if (
      !customer ||
      !items.length ||
      !shippingAddress ||
      step !== "confirmed" ||
      !requiredAgreementsChecked(agreements)
    ) {
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout/trade-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, shippingAddress }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");

      placingOrder.current = true; // suppress the empty-cart redirect during nav
      clearCart();
      const ids = (data.submissionIds as string[]).join(",");
      // Keep the overlay up through navigation — don't reset `submitting` on
      // success, or the plain checkout flashes before the order page loads.
      window.location.href = `/sell-my/checkout/onepage/success?refs=${encodeURIComponent(ids)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setSubmitting(false);
    }
  }

  if (loading || !customer) {
    return (
      <div className="container py-12 text-center text-grey-dark">
        Loading checkout...
      </div>
    );
  }

  const formDefaults: Partial<ShippingAddress> = {
    firstName: shippingAddress?.firstName ?? customer.firstName ?? "",
    lastName: shippingAddress?.lastName ?? customer.lastName ?? "",
    company: shippingAddress?.company,
    street: shippingAddress?.street ?? ["", ""],
    city: shippingAddress?.city ?? "",
    region: shippingAddress?.region ?? "",
    postcode: shippingAddress?.postcode ?? "",
    countryId: shippingAddress?.countryId ?? "GB",
    telephone: shippingAddress?.telephone ?? customer.phone ?? "",
  };

  return (
    <div className="column main">
      <CheckoutProcessingOverlay show={submitting} label="Confirming your trade-in…" />
      <div id="checkout" className="checkout-container">
        <div className="opc-wrapper">
          <CheckoutProgressBar />
          <h1>Checkout Securely</h1>

          <ol className="opc" id="checkoutSteps">
            {step === "address" ? (
              <CheckoutShippingForm
                initial={formDefaults}
                agreements={agreements}
                onAgreementsChange={setAgreements}
                canCancel={Boolean(shippingAddress)}
                onCancel={() => {
                  setStep("confirmed");
                  setError(null);
                }}
                onConfirm={(address) => {
                  setShippingAddress(address);
                  saveCheckoutAddress(address);
                  setStep("confirmed");
                  setError(null);
                }}
              />
            ) : (
              shippingAddress && (
                <CheckoutConfirmedAddress
                  address={shippingAddress}
                  agreements={agreements}
                  onAgreementsChange={setAgreements}
                  onChangeAddress={() => setStep("address")}
                  onSubmit={handleTradeIn}
                  submitting={submitting}
                  error={error}
                />
              )
            )}
          </ol>
        </div>

        <CheckoutOrderSummary items={items} />
      </div>
    </div>
  );
}
