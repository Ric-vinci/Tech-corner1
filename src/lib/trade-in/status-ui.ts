import type { TradeInStatus } from "./status";

/**
 * Single source of truth for how each status is presented in the admin.
 * `dot` is used in the timeline / badges, `badge` on chips and table cells.
 */
type StatusStyle = { badge: string; dot: string };

const STYLES: Record<TradeInStatus, StatusStyle> = {
  submitted: { badge: "bg-blue/10 text-blue ring-blue/20", dot: "bg-blue" },
  awaiting_shipment: { badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  in_transit: { badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  received: { badge: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
  under_inspection: { badge: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
  revised_offer: { badge: "bg-orange-50 text-orange-700 ring-orange-200", dot: "bg-orange-500" },
  accepted: { badge: "bg-green-light text-green ring-green/20", dot: "bg-green" },
  paid: { badge: "bg-green-light text-green ring-green/20", dot: "bg-green" },
  rejected: { badge: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
  closed: { badge: "bg-grey-lighter text-grey-dark ring-grey-light", dot: "bg-grey-dark" },
};

export function statusBadgeClass(status: TradeInStatus): string {
  return STYLES[status]?.badge ?? STYLES.closed.badge;
}

export function statusDotClass(status: TradeInStatus): string {
  return STYLES[status]?.dot ?? STYLES.closed.dot;
}

/** Statuses that still need someone to act on them. */
export const OPEN_STATUSES: TradeInStatus[] = [
  "submitted",
  "awaiting_shipment",
  "in_transit",
  "received",
  "under_inspection",
  "revised_offer",
];
