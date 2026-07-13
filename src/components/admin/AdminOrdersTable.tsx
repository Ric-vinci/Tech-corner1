"use client";

import { useState } from "react";

export type BuyOrderRow = {
  id: string;
  created_at: string;
  customer_email: string | null;
  total: number;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
  items: { productName: string; quantity: number }[];
};

const money = (v: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(v);
const shortRef = (id: string) => "#" + id.replace(/-/g, "").slice(0, 6).toUpperCase();
const fmtDate = (v: string) => new Date(v).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const methodLabel: Record<string, string> = { paypal: "PayPal", gift_card: "Store credit", bank: "Bank transfer" };

function StatusBadge({ paid, awaiting }: { paid: boolean; awaiting: boolean }) {
  const cls = paid ? "bg-green-light text-green" : awaiting ? "bg-amber-50 text-amber-700" : "bg-grey-lighter text-grey-dark";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{paid ? "Paid" : awaiting ? "Awaiting payment" : "Pending"}</span>;
}

function Row({ order }: { order: BuyOrderRow }) {
  const [status, setStatus] = useState(order.payment_status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paid = status === "paid";
  const awaiting = !paid && order.payment_method === "bank";

  async function markPaid() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setStatus("paid");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-b border-grey-light last:border-0 align-top">
      <td className="px-5 py-4">
        <div className="font-medium text-black">{shortRef(order.id)}</div>
        <div className="text-xs text-grey-dark">{fmtDate(order.created_at)}</div>
      </td>
      <td className="px-3 py-4 text-grey-dark">{order.customer_email ?? "—"}</td>
      <td className="px-3 py-4">
        {order.items.map((it, i) => (
          <div key={i} className="text-sm text-black">{it.productName}{it.quantity > 1 ? ` ×${it.quantity}` : ""}</div>
        ))}
      </td>
      <td className="px-3 py-4 text-grey-dark">{order.payment_method ? methodLabel[order.payment_method] ?? order.payment_method : "—"}</td>
      <td className="px-3 py-4 text-right tabular-nums font-medium">{money(order.total)}</td>
      <td className="px-3 py-4"><StatusBadge paid={paid} awaiting={awaiting} /></td>
      <td className="px-5 py-4 text-right">
        {awaiting ? (
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={markPaid}
              disabled={busy}
              className="rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-pure-white transition hover:bg-black-off disabled:opacity-50"
            >
              {busy ? "…" : "Mark as paid"}
            </button>
            {error && <span className="text-xs text-red-600">{error}</span>}
          </div>
        ) : (
          <span className="text-xs text-grey-dark">—</span>
        )}
      </td>
    </tr>
  );
}

export default function AdminOrdersTable({ orders, awaitingCount }: { orders: BuyOrderRow[]; awaitingCount: number }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-grey-dark">
          Refurbished-device purchases. {orders.length} total{awaitingCount ? ` · ${awaitingCount} awaiting bank payment` : ""}.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-grey-light bg-pure-white">
        {orders.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-grey-dark">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-grey-light bg-grey-lightest text-left text-xs uppercase tracking-wide text-grey-dark">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Items</th>
                  <th className="px-3 py-3 font-medium">Method</th>
                  <th className="px-3 py-3 text-right font-medium">Total</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => <Row key={o.id} order={o} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
