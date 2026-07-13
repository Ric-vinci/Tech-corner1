import type { TradeInStatus } from "@/lib/trade-in/status";

/** The customer-device journey, in order. Each maps to one or more statuses. */
const STEPS: { label: string; statuses: TradeInStatus[] }[] = [
  { label: "Submitted", statuses: ["submitted"] },
  { label: "Shipping", statuses: ["awaiting_shipment", "in_transit"] },
  { label: "Received", statuses: ["received"] },
  { label: "Inspection", statuses: ["under_inspection", "revised_offer"] },
  { label: "Accepted", statuses: ["accepted"] },
  { label: "Paid", statuses: ["paid"] },
  { label: "Published", statuses: [] },
];

function currentStep(status: TradeInStatus, published: boolean): number {
  if (published) return 6;
  const idx = STEPS.findIndex((s) => s.statuses.includes(status));
  if (idx >= 0) return idx;
  if (status === "closed") return 6;
  return 0;
}

export default function PipelineStepper({ status, published }: { status: TradeInStatus; published: boolean }) {
  const rejected = status === "rejected";
  const active = currentStep(status, published);

  if (rejected) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
        This trade-in was rejected — it does not continue through the pipeline.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-grey-light bg-pure-white px-5 py-4">
      <ol className="flex min-w-max items-center gap-1">
        {STEPS.map((step, i) => {
          const state = i < active ? "done" : i === active ? "current" : "todo";
          return (
            <li key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    state === "done"
                      ? "bg-green text-pure-white"
                      : state === "current"
                        ? "bg-blue text-pure-white ring-4 ring-blue/15"
                        : "bg-grey-lighter text-grey-dark"
                  }`}
                >
                  {state === "done" ? (
                    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                      <path d="m5 10 3 3 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className={`whitespace-nowrap text-xs ${state === "current" ? "font-semibold text-black" : "text-grey-dark"}`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span className={`mx-1 mb-5 h-0.5 w-8 rounded md:w-14 ${i < active ? "bg-green" : "bg-grey-light"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
