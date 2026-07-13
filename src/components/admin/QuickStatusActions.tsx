"use client";

import { useState } from "react";
import { TRADE_IN_STATUS_TRANSITIONS, type TradeInStatus } from "@/lib/trade-in/status";
import type { TradeInEvent, TradeInSubmission } from "@/lib/trade-in/types";

type ActionMeta = {
  label: string;
  tone: "primary" | "neutral" | "accept" | "danger";
  /** Consequential + hard to undo — show an inline confirmation first. */
  confirm?: string;
};

const ACTIONS: Record<Exclude<TradeInStatus, "paid">, ActionMeta> = {
  submitted: { label: "Reopen", tone: "neutral" },
  awaiting_shipment: { label: "Send return pack", tone: "primary" },
  in_transit: { label: "Mark in transit", tone: "neutral" },
  received: { label: "Mark received", tone: "primary" },
  under_inspection: { label: "Start inspection", tone: "primary" },
  revised_offer: { label: "Send revised offer", tone: "neutral" },
  accepted: {
    label: "Accept device",
    tone: "accept",
    confirm: "Accept this device? A Shopify draft product is created and the customer is emailed.",
  },
  rejected: {
    label: "Reject",
    tone: "danger",
    confirm: "Reject this device? The customer is emailed that it wasn't accepted.",
  },
  closed: { label: "Close", tone: "neutral", confirm: "Close this submission? No further changes." },
};

const TONE: Record<ActionMeta["tone"], string> = {
  primary: "bg-black text-pure-white hover:bg-black-off",
  accept: "bg-green text-pure-white hover:bg-green/90",
  danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  neutral: "border border-grey-light bg-pure-white text-grey-dark hover:border-grey-dark hover:text-black",
};

type Props = {
  submission: TradeInSubmission;
  onUpdated: (submission: TradeInSubmission, events: TradeInEvent[]) => void;
};

export default function QuickStatusActions({ submission, onUpdated }: Props) {
  const [busy, setBusy] = useState<TradeInStatus | null>(null);
  const [confirming, setConfirming] = useState<TradeInStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Payout ("paid") is handled by the payout panel, never as a bare status flip.
  const nextStatuses = TRADE_IN_STATUS_TRANSITIONS[submission.status].filter((s) => s !== "paid");
  if (nextStatuses.length === 0) return null;

  async function move(status: TradeInStatus) {
    setBusy(status);
    setConfirming(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/trade-in/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      // Lift the fresh row up so the whole detail view — including the next set
      // of quick actions — updates immediately, without a page refresh.
      onUpdated(data.submission, data.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  function handleClick(status: TradeInStatus) {
    const meta = ACTIONS[status as Exclude<TradeInStatus, "paid">];
    if (meta.confirm) setConfirming(status);
    else move(status);
  }

  const confirmMeta = confirming ? ACTIONS[confirming as Exclude<TradeInStatus, "paid">] : null;

  return (
    <section className="rounded-2xl border border-grey-light bg-pure-white">
      <div className="border-b border-grey-light px-5 py-3.5">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-grey-dark">Quick actions</h2>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap gap-2">
          {nextStatuses.map((status) => {
            const meta = ACTIONS[status as Exclude<TradeInStatus, "paid">];
            return (
              <button
                key={status}
                type="button"
                onClick={() => handleClick(status)}
                disabled={busy !== null || confirming !== null}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-60 ${TONE[meta.tone]}`}
              >
                {busy === status ? "Saving…" : meta.label}
              </button>
            );
          })}
        </div>

        {confirmMeta ? (
          <div className="rounded-lg border border-grey-light bg-grey-lightest p-3">
            <p className="text-sm text-black">{confirmMeta.confirm}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => move(confirming!)}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold text-pure-white transition ${
                  confirmMeta.tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-green hover:bg-green/90"
                }`}
              >
                Yes, {confirmMeta.label.toLowerCase()}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="rounded-lg border border-grey-light bg-pure-white px-3.5 py-2 text-sm font-medium text-grey-dark transition hover:border-grey-dark hover:text-black"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-grey-dark">Each move emails the customer where relevant.</p>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</p>
        )}
      </div>
    </section>
  );
}
