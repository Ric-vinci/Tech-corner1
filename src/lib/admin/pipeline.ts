import type { TradeInStatus } from "@/lib/trade-in/status";

/**
 * The trade-in admin is a manufacturing pipeline. Customers' devices move through
 * queues; each queue is a filtered view of `trade_in_submissions` by status.
 *
 *   Trade-In Queue → Inspection Queue → Refurbishment Queue → (Refurb stock) → Shopify
 *
 * "Ready for Sale" and "Shopify Sync" live on the Refurb stock screen
 * (`/admin/inventory`) because that is where accepted units become published
 * Shopify products.
 */
export type PipelineQueue = {
  slug: string;
  label: string;
  description: string;
  statuses: TradeInStatus[];
};

export const PIPELINE_QUEUES: PipelineQueue[] = [
  {
    slug: "trade-in",
    label: "Trade-In Queue",
    description: "New submissions and devices on their way to the warehouse.",
    statuses: ["submitted", "awaiting_shipment", "in_transit"],
  },
  {
    slug: "inspection",
    label: "Inspection Queue",
    description: "Devices that have arrived — inspect, grade and decide (accept / revise / reject).",
    statuses: ["received", "under_inspection", "revised_offer"],
  },
  {
    slug: "refurbishment",
    label: "Refurbishment Queue",
    description: "Accepted devices you now own — pay the customer and prepare for resale.",
    statuses: ["accepted", "paid"],
  },
];

export function getPipelineQueue(slug: string | undefined): PipelineQueue | undefined {
  return PIPELINE_QUEUES.find((q) => q.slug === slug);
}

/** Which queue a status currently sits in (for dashboards / links). */
export function queueForStatus(status: TradeInStatus): PipelineQueue | undefined {
  return PIPELINE_QUEUES.find((q) => q.statuses.includes(status));
}
