"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  TRADE_IN_STATUSES,
  TRADE_IN_STATUS_LABELS,
  type TradeInStatus,
} from "@/lib/trade-in/status";
import { statusBadgeClass, statusDotClass } from "@/lib/trade-in/status-ui";
import { ADMIN_CATEGORIES, categoryLabel } from "@/lib/admin/categories";
import type { TradeInSubmission } from "@/lib/trade-in/types";

export type TradeInStats = {
  total: number;
  needsAction: number;
  accepted: number;
  paid: number;
  openValue: number;
};

export type QueueInfo = {
  slug: string;
  label: string;
  description: string;
  statuses: TradeInStatus[];
};

type Props = {
  submissions: TradeInSubmission[];
  stats: TradeInStats;
  activeStatus?: string;
  activeCategory?: string;
  queue?: QueueInfo;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-grey-light bg-pure-white p-5">
      <div className="text-sm text-grey-dark">{label}</div>
      <div className="mt-1 font-heading text-3xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-grey-dark">{hint}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: TradeInStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(status)}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(status)}`} />
      {TRADE_IN_STATUS_LABELS[status]}
    </span>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="px-6 py-20 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-grey-lighter">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-grey-dark">
          <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="font-medium text-black">No trade-ins {filtered ? "match this filter" : "yet"}</p>
      <p className="mt-1 text-sm text-grey-dark">
        {filtered
          ? "Try a different status, or clear the filter."
          : "Submissions appear here as soon as a customer completes checkout."}
      </p>
    </div>
  );
}

export default function TradeInList({ submissions, stats, activeStatus, activeCategory, queue }: Props) {
  const [query, setQuery] = useState("");

  // Within a queue, the status pills are scoped to that queue's statuses.
  const pillStatuses = queue ? queue.statuses : TRADE_IN_STATUSES;

  // Build hrefs that preserve queue + category while changing status (or vice-versa).
  const buildHref = (over: { status?: string | null; category?: string | null }) => {
    const p = new URLSearchParams();
    if (queue) p.set("queue", queue.slug);
    const cat = over.category === undefined ? activeCategory : over.category;
    if (cat) p.set("category", cat);
    const st = over.status === undefined ? activeStatus : over.status;
    if (st) p.set("status", st);
    const qs = p.toString();
    return qs ? `/admin/trade-ins?${qs}` : "/admin/trade-ins";
  };
  const basePath = buildHref({ status: null });
  const statusHref = (status: TradeInStatus) => buildHref({ status });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter(
      (row) =>
        row.product_name.toLowerCase().includes(q) ||
        (row.customer_email ?? "").toLowerCase().includes(q) ||
        (row.customer_name ?? "").toLowerCase().includes(q) ||
        row.id.toLowerCase().startsWith(q),
    );
  }, [submissions, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{queue ? queue.label : "Trade-ins"}</h1>
          <p className="mt-1 text-sm text-grey-dark">
            {queue ? queue.description : "Review customer devices and move them through the workflow."}
          </p>
        </div>
        <a
          href="/api/admin/trade-in/export"
          className="rounded-lg border border-grey-light bg-pure-white px-3 py-2 text-sm font-medium text-grey-dark transition hover:border-grey-dark hover:text-black"
          title="Accepted, unpaid bank-transfer submissions — upload to your bank's bulk payment screen"
        >
          Export bank payment batch (CSV)
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total submissions" value={String(stats.total)} />
        <StatCard label="Needs action" value={String(stats.needsAction)} hint="Not yet accepted, rejected or closed" />
        <StatCard label="Accepted" value={String(stats.accepted)} hint={`${stats.paid} paid out`} />
        <StatCard label="Open quote value" value={money(stats.openValue)} hint="Across submissions needing action" />
      </div>

      {/* Filters + search */}
      <div className="space-y-4 rounded-2xl border border-grey-light bg-pure-white p-4">
        <div className="relative">
          <svg viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey-dark">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
            <path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by device, customer or submission id…"
            className="h-10 w-full rounded-lg border border-grey-light bg-grey-lightest pl-9 pr-3 text-sm outline-none transition focus:border-black focus:bg-pure-white"
          />
        </div>

        {/* Category (matches the customer website's categories) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-grey-dark">Category</span>
          <Link
            href={buildHref({ category: null, status: null })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              !activeCategory ? "bg-black text-pure-white" : "bg-grey-lighter text-grey-dark hover:bg-grey-light"
            }`}
          >
            All
          </Link>
          {ADMIN_CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={buildHref({ category: c.key, status: null })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                activeCategory === c.key ? "bg-black text-pure-white" : "bg-grey-lighter text-grey-dark hover:bg-grey-light"
              }`}
            >
              {categoryLabel(c.key)}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={basePath}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              !activeStatus ? "bg-black text-pure-white" : "bg-grey-lighter text-grey-dark hover:bg-grey-light"
            }`}
          >
            {queue ? "All in queue" : "All"}
          </Link>
          {pillStatuses.map((status) => (
            <Link
              key={status}
              href={statusHref(status)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                activeStatus === status
                  ? "bg-black text-pure-white"
                  : "bg-grey-lighter text-grey-dark hover:bg-grey-light"
              }`}
            >
              {TRADE_IN_STATUS_LABELS[status]}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-grey-light bg-pure-white">
        {rows.length === 0 ? (
          <EmptyState filtered={Boolean(activeStatus) || Boolean(activeCategory) || Boolean(query)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-grey-light bg-grey-lightest text-left text-xs uppercase tracking-wide text-grey-dark">
                  <th className="px-5 py-3 font-medium">Device</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Condition</th>
                  <th className="px-5 py-3 font-medium text-right">Quote</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const price = Number(row.revised_price ?? row.quoted_price);
                  const revised = row.revised_price != null;
                  return (
                    <tr key={row.id} className="group border-b border-grey-light last:border-0 transition hover:bg-grey-lightest">
                      <td className="px-5 py-4">
                        <Link href={`/admin/trade-ins/${row.id}`} className="block">
                          <span className="font-medium text-black group-hover:text-blue">{row.product_name}</span>
                          <span className="mt-0.5 block font-mono text-xs text-grey-dark">
                            {row.id.slice(0, 8).toUpperCase()}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span className="block text-black">{row.customer_name ?? "—"}</span>
                        <span className="block text-xs text-grey-dark">{row.customer_email ?? "—"}</span>
                      </td>
                      <td className="px-5 py-4 text-grey-dark">{row.condition}</td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-medium tabular-nums">£{price.toFixed(2)}</span>
                        {revised && <span className="ml-1 text-xs text-orange-600">revised</span>}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-grey-dark">{formatDate(row.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
