export function formatGbp(amount: number) {
  return `£${Number(amount).toFixed(2)}`;
}

/**
 * The amount the customer is actually paid for a trade-in: the revised offer if
 * inspection changed it, otherwise the original quote. Matches the payout logic
 * (`revised_price ?? quoted_price`) so what they see equals what they receive.
 */
export function orderTotal(item: { quoted_price: number; revised_price: number | null }): number {
  return item.revised_price ?? item.quoted_price;
}

export function formatOrderDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB");
}

export function formatOrderNumber(id: string) {
  return id.replace(/-/g, "").slice(0, 6).toUpperCase();
}

const STATUS_LABELS: Record<string, string> = {
  submitted: "Pending",
  awaiting_shipment: "Awaiting Shipment",
  in_transit: "In Transit",
  received: "Received",
  under_review: "Under Review",
  accepted: "Accepted",
  rejected: "Rejected",
  paid: "Paid",
  closed: "Closed",
};

export function formatOrderStatus(status: string) {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
