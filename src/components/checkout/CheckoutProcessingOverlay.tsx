"use client";

/** Full-screen overlay shown while an order is being submitted / redirected,
 *  so the customer sees progress instead of a frozen button or blank page. */
export default function CheckoutProcessingOverlay({ show, label }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-white/90 backdrop-blur-sm" role="status" aria-live="polite">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-grey-light border-t-black" />
      <p className="text-base font-medium text-black">{label ?? "Processing…"}</p>
      <p className="text-sm text-grey-dark">Please don&apos;t close this window.</p>
    </div>
  );
}
