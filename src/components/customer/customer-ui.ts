export function formatGbp(amount: number) {
  return `£${Number(amount).toFixed(2)}`;
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
