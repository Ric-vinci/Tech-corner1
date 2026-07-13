"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  TRADE_IN_STATUS_LABELS,
  TRADE_IN_STATUS_TRANSITIONS,
  type TradeInStatus,
} from "@/lib/trade-in/status";
import { statusBadgeClass, statusDotClass } from "@/lib/trade-in/status-ui";
import PayoutPanel from "@/components/admin/PayoutPanel";
import QuickStatusActions from "@/components/admin/QuickStatusActions";
import InspectionCard from "@/components/admin/InspectionCard";
import PipelineStepper from "@/components/admin/PipelineStepper";
import type { TradeInEvent, TradeInSubmission } from "@/lib/trade-in/types";

type Props = {
  submission: TradeInSubmission;
  events: TradeInEvent[];
  modelImage: string | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const money = (value: number) => `£${Number(value).toFixed(2)}`;

function Card({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-grey-light bg-pure-white">
      <div className="flex items-center justify-between border-b border-grey-light px-5 py-3.5">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-grey-dark">{title}</h2>
        {aside}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="shrink-0 text-grey-dark">{label}</dt>
      <dd className="text-right font-medium text-black">{value ?? "—"}</dd>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-black">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-grey-light bg-grey-lightest px-3 py-2 text-sm outline-none transition focus:border-black focus:bg-pure-white";

export default function TradeInDetail({ submission, events: initialEvents, modelImage }: Props) {
  const router = useRouter();
  const [submissionState, setSubmissionState] = useState(submission);
  const [events, setEvents] = useState(initialEvents);
  const [status, setStatus] = useState<TradeInStatus | "">("");
  const [adminNotes, setAdminNotes] = useState(submission.admin_notes ?? "");
  const [trackingNumber, setTrackingNumber] = useState(submission.tracking_number ?? "");
  const [revisedPrice, setRevisedPrice] = useState(
    submission.revised_price != null ? String(submission.revised_price) : "",
  );
  const [payoutReference, setPayoutReference] = useState(submission.payout_reference ?? "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);

  const nextStatuses = TRADE_IN_STATUS_TRANSITIONS[submissionState.status];
  const payout = submissionState.payout_details as Record<string, string> | null;
  const address = submissionState.shipping_address;
  const price = Number(submissionState.revised_price ?? submissionState.quoted_price);

  // Shared by the quick actions and payout panel: apply a fresh row + events so
  // the whole view (including the next set of quick actions) updates instantly.
  function applyUpdate(next: TradeInSubmission, nextEvents?: TradeInEvent[]) {
    setSubmissionState(next);
    if (nextEvents) setEvents(nextEvents);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setWarnings([]);
    setFailed(false);

    try {
      const res = await fetch(`/api/admin/trade-in/${submissionState.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status || undefined,
          adminNotes,
          trackingNumber,
          revisedPrice: revisedPrice ? Number(revisedPrice) : undefined,
          payoutReference,
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");

      setSubmissionState(data.submission);
      setEvents(data.events);
      setWarnings(data.warnings ?? []);
      setStatus("");
      setNote("");
      setMessage("Submission updated.");
      router.refresh();
    } catch (err) {
      setFailed(true);
      setMessage(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/trade-ins" className="inline-flex items-center gap-1.5 text-sm text-grey-dark transition hover:text-black">
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
            <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to trade-ins
        </Link>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{submissionState.product_name}</h1>
            <p className="mt-1 font-mono text-xs text-grey-dark">{submissionState.id}</p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${statusBadgeClass(submissionState.status)}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(submissionState.status)}`} />
            {TRADE_IN_STATUS_LABELS[submissionState.status]}
          </span>
        </div>
      </div>

      <PipelineStepper status={submissionState.status} published={Boolean(submissionState.shopify_inventory_product_id)} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: details */}
        <div className="space-y-6 lg:col-span-2">
          <Card
            title="Device"
            aside={<span className="font-heading text-lg font-semibold">{money(price)}</span>}
          >
            <dl className="divide-y divide-grey-light">
              <Row label="Condition" value={submissionState.condition} />
              <Row label="Quoted price" value={money(submissionState.quoted_price)} />
              {submissionState.revised_price != null && (
                <Row label="Revised offer" value={<span className="text-orange-600">{money(submissionState.revised_price)}</span>} />
              )}
              <Row label="Payment method" value={submissionState.payment_method} />
              <Row label="Return pack" value={submissionState.return_pack} />
              <Row label="IMEI" value={submissionState.imei} />
              {submissionState.tracking_number && <Row label="Tracking" value={submissionState.tracking_number} />}
              {submissionState.shopify_inventory_product_id && (
                <Row
                  label="Shopify product"
                  value={<span className="font-mono text-xs">{submissionState.shopify_inventory_product_id}</span>}
                />
              )}
            </dl>
          </Card>

          <InspectionCard submission={submissionState} modelImage={modelImage} onUpdated={applyUpdate} />

          <Card title="Customer">
            <dl className="divide-y divide-grey-light">
              <Row label="Name" value={submissionState.customer_name} />
              <Row label="Email" value={submissionState.customer_email} />
              <Row label="Phone" value={submissionState.customer_phone} />
              {payout?.paypalEmail && <Row label="PayPal" value={payout.paypalEmail} />}
              {payout?.accountNumber && (
                <Row label="Bank" value={`${payout.accountName ?? ""} ${payout.sortCode ?? ""} ${payout.accountNumber}`.trim()} />
              )}
              {submissionState.payout_reference && <Row label="Payout ref" value={submissionState.payout_reference} />}
            </dl>

            {address && (
              <div className="mt-4 rounded-xl bg-grey-lightest p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-grey-dark">Shipping address</p>
                <address className="text-sm not-italic leading-relaxed text-black">
                  {address.firstName} {address.lastName}
                  {address.company ? <><br />{address.company}</> : null}
                  {address.street.filter(Boolean).map((line, i) => (
                    <span key={`${i}-${line}`}>
                      <br />
                      {line}
                    </span>
                  ))}
                  <br />
                  {address.city}
                  {address.region ? `, ${address.region}` : ""} {address.postcode}
                  <br />
                  {address.countryName ?? address.countryId}
                </address>
              </div>
            )}
          </Card>

          <Card title="Event history">
            {events.length === 0 ? (
              <p className="text-sm text-grey-dark">No events yet.</p>
            ) : (
              <ol className="relative space-y-5 border-l border-grey-light pl-5">
                {events.map((event) => (
                  <li key={event.id} className="relative">
                    <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-grey-light ring-4 ring-pure-white" />
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-black">{event.event_type.replace(/^status_/, "")}</span>
                      <time className="text-xs text-grey-dark">{formatDate(event.created_at)}</time>
                    </div>
                    {event.note && <p className="mt-0.5 text-sm text-grey-dark">{event.note}</p>}
                    {event.actor_email && <p className="mt-0.5 text-xs text-grey-dark">by {event.actor_email}</p>}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        {/* Right: actions */}
        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <QuickStatusActions submission={submissionState} onUpdated={applyUpdate} />

          <PayoutPanel submission={submissionState} onUpdated={applyUpdate} />

          <Card title="Update workflow">
            <form onSubmit={handleSave} className="space-y-4">
              {nextStatuses.length > 0 ? (
                <Field label="Change status" htmlFor="next-status">
                  <select
                    id="next-status"
                    className={inputClass}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TradeInStatus | "")}
                  >
                    <option value="">Keep current status</option>
                    {nextStatuses.map((next) => (
                      <option key={next} value={next}>
                        {TRADE_IN_STATUS_LABELS[next]}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <p className="rounded-lg bg-grey-lightest px-3 py-2 text-sm text-grey-dark">
                  This submission is closed — no further transitions.
                </p>
              )}

              <Field label="Tracking number" htmlFor="tracking">
                <input id="tracking" className={inputClass} value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
              </Field>

              <Field label="Revised offer (£)" htmlFor="revised-price">
                <input
                  id="revised-price"
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputClass}
                  value={revisedPrice}
                  onChange={(e) => setRevisedPrice(e.target.value)}
                />
              </Field>

              <Field label="Payout reference" htmlFor="payout-ref">
                <input id="payout-ref" className={inputClass} value={payoutReference} onChange={(e) => setPayoutReference(e.target.value)} />
              </Field>

              <Field label="Admin notes" htmlFor="admin-notes">
                <textarea id="admin-notes" className={`${inputClass} min-h-[90px]`} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
              </Field>

              <Field label="Event note (optional)" htmlFor="event-note">
                <input
                  id="event-note"
                  className={inputClass}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Return pack emailed to customer"
                />
              </Field>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-pure-white transition hover:bg-black-off disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>

              {message && (
                <p className={`text-sm ${failed ? "text-red-600" : "text-green"}`}>{message}</p>
              )}
              {warnings.map((warning) => (
                <p key={warning} className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-200">
                  {warning}
                </p>
              ))}
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
