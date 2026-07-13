export const TRADE_IN_STATUSES = [
  "submitted",
  "awaiting_shipment",
  "in_transit",
  "received",
  "under_inspection",
  "revised_offer",
  "accepted",
  "rejected",
  "paid",
  "closed",
] as const;

export type TradeInStatus = (typeof TRADE_IN_STATUSES)[number];

export const TRADE_IN_STATUS_LABELS: Record<TradeInStatus, string> = {
  submitted: "Submitted",
  awaiting_shipment: "Awaiting shipment",
  in_transit: "In transit",
  received: "Received at warehouse",
  under_inspection: "Under inspection",
  revised_offer: "Revised offer sent",
  accepted: "Accepted",
  rejected: "Rejected",
  paid: "Paid",
  closed: "Closed",
};

/** Allowed admin transitions from each status. */
export const TRADE_IN_STATUS_TRANSITIONS: Record<TradeInStatus, TradeInStatus[]> = {
  submitted: ["awaiting_shipment", "rejected", "closed"],
  awaiting_shipment: ["in_transit", "received", "rejected", "closed"],
  in_transit: ["received", "rejected", "closed"],
  received: ["under_inspection", "accepted", "revised_offer", "rejected", "closed"],
  under_inspection: ["accepted", "revised_offer", "rejected", "closed"],
  revised_offer: ["accepted", "rejected", "closed"],
  accepted: ["paid", "closed"],
  rejected: ["closed"],
  paid: ["closed"],
  closed: [],
};

export function canTransitionStatus(from: TradeInStatus, to: TradeInStatus): boolean {
  return TRADE_IN_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTradeInStatus(value: string): value is TradeInStatus {
  return TRADE_IN_STATUSES.includes(value as TradeInStatus);
}
