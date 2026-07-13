"use client";

import { useState } from "react";
import {
  PAYOUT_PROVIDERS,
  PAYOUT_PROVIDER_LABELS,
  type PayoutProviderId,
} from "@/lib/payout/types";
import type { TradeInEvent, TradeInSubmission } from "@/lib/trade-in/types";

const inputClass =
  "w-full rounded-lg border border-grey-light bg-grey-lightest px-3 py-2 text-sm outline-none transition focus:border-black focus:bg-pure-white";

const money = (value: number) => `£${Number(value).toFixed(2)}`;

/** Mirrors resolveProvider() on the server. */
function defaultProvider(paymentMethod: string): PayoutProviderId {
  const value = paymentMethod.toLowerCase();
  if (value.includes("paypal")) return "paypal";
  if (value.includes("bank")) return "bank";
  return "gift_card";
}

const STATUS_TONE: Record<string, string> = {
  paid: "bg-green-light text-green ring-green/20",
  processing: "bg-amber-50 text-amber-700 ring-amber-200",
  unclaimed: "bg-amber-50 text-amber-700 ring-amber-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
};

type Props = {
  submission: TradeInSubmission;
  onUpdated: (submission: TradeInSubmission, events?: TradeInEvent[]) => void;
};

export default function PayoutPanel({ submission, onUpdated }: Props) {
  const amount = Number(submission.revised_price ?? submission.quoted_price ?? 0);

  const [provider, setProvider] = useState<PayoutProviderId>(defaultProvider(submission.payment_method));
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [giftCardCode, setGiftCardCode] = useState<string | null>(null);

  const inFlight = submission.payout_status === "processing";
  const alreadyPaid = submission.payout_status === "paid";
  const canPay = submission.status === "accepted" && !alreadyPaid && !inFlight && !submission.payout_reference;

  async function handleReconcile() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/trade-in/${submission.id}/payout/reconcile`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not check the payout");
      if (data.message) setError(data.message);
      if (data.submission) onUpdated(data.submission);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check the payout");
    } finally {
      setBusy(false);
    }
  }

  async function handlePay() {
    if (provider === "bank" && !reference.trim()) {
      setError("Enter the bank reference from your banking app first.");
      return;
    }
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/trade-in/${submission.id}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, reference: reference || undefined, message: message || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Payout failed");
      if (data.giftCardCode) setGiftCardCode(data.giftCardCode);
      if (data.submission) onUpdated(data.submission);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-grey-light bg-pure-white">
      <div className="flex items-center justify-between border-b border-grey-light px-5 py-3.5">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-grey-dark">Payout</h2>
        <span className="font-heading text-lg font-semibold">{money(amount)}</span>
      </div>

      <div className="space-y-4 p-5">
        {submission.payout_status && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-grey-dark">Status</span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                STATUS_TONE[submission.payout_status] ?? "bg-grey-lighter text-grey-dark ring-grey-light"
              }`}
            >
              {submission.payout_status}
            </span>
          </div>
        )}

        {submission.payout_reference && (
          <p className="break-all rounded-lg bg-grey-lightest px-3 py-2 font-mono text-xs text-grey-dark">
            {submission.payout_reference}
          </p>
        )}

        {submission.payout_error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-inset ring-red-200">
            {submission.payout_error}
          </p>
        )}

        {giftCardCode && (
          <div className="rounded-lg bg-green-light px-3 py-3 text-center ring-1 ring-inset ring-green/20">
            <p className="text-xs text-grey-dark">Gift card code — shown once, already emailed</p>
            <p className="mt-1 font-mono text-base font-bold tracking-widest text-black">{giftCardCode}</p>
          </div>
        )}

        {alreadyPaid ? (
          <p className="text-sm text-grey-dark">
            Paid{submission.paid_at ? ` on ${new Date(submission.paid_at).toLocaleDateString("en-GB")}` : ""} via{" "}
            {PAYOUT_PROVIDER_LABELS[(submission.payout_provider as PayoutProviderId) ?? "bank"]}.
          </p>
        ) : inFlight ? (
          <>
            <p className="text-sm text-grey-dark">
              PayPal has accepted the payout but hasn&apos;t confirmed delivery yet. This usually settles within a
              minute.
            </p>
            {error && (
              <p className="rounded-lg bg-grey-lightest px-3 py-2 text-sm text-grey-dark">{error}</p>
            )}
            <button
              type="button"
              onClick={handleReconcile}
              disabled={busy}
              className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-pure-white transition hover:bg-black-off disabled:opacity-60"
            >
              {busy ? "Checking…" : "Check payment status"}
            </button>
          </>
        ) : !canPay ? (
          <p className="rounded-lg bg-grey-lightest px-3 py-2 text-sm text-grey-dark">
            Accept the device before issuing a payout.
          </p>
        ) : (
          <>
            <div>
              <label htmlFor="payout-provider" className="mb-1.5 block text-sm font-medium text-black">
                Rail
              </label>
              <select
                id="payout-provider"
                className={inputClass}
                value={provider}
                onChange={(e) => setProvider(e.target.value as PayoutProviderId)}
              >
                {PAYOUT_PROVIDERS.map((id) => (
                  <option key={id} value={id}>
                    {PAYOUT_PROVIDER_LABELS[id]}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-grey-dark">
                Customer chose: <span className="font-medium">{submission.payment_method}</span>
              </p>
            </div>

            {provider === "bank" && (
              <div>
                <label htmlFor="payout-reference" className="mb-1.5 block text-sm font-medium text-black">
                  Bank reference
                </label>
                <input
                  id="payout-reference"
                  className={inputClass}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Reference from your banking app"
                />
                <p className="mt-1 text-xs text-grey-dark">
                  Send the money first, then record it here. Nothing is transferred automatically.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="payout-message" className="mb-1.5 block text-sm font-medium text-black">
                Message to customer (optional)
              </label>
              <input
                id="payout-message"
                className={inputClass}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Paid on 10 July, arrives in 2 days"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handlePay}
              disabled={busy}
              className="w-full rounded-lg bg-green px-4 py-2.5 text-sm font-semibold text-pure-white transition hover:bg-green/90 disabled:opacity-60"
            >
              {busy ? "Issuing…" : `Pay ${money(amount)} via ${PAYOUT_PROVIDER_LABELS[provider]}`}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
