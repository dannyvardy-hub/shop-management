"use client";

import { useEffect, useState } from "react";
import { watchOrders, updateOrder, deleteOrder } from "@/lib/data";

const STATUSES = ["open", "fulfilled", "cancelled"];

function fmtDate(ts) {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = watchOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Orders</h1>
      <p className="text-ink/50 text-sm mb-6">Every order you've recorded, newest first.</p>

      {loading && <p className="text-sm text-ink/40">Loading…</p>}
      {!loading && orders.length === 0 && (
        <p className="text-sm text-ink/40">
          Nothing here yet — record your first order from the New order tab.
        </p>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="receipt-card p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-medium">
                  {order.customerName || "Unnamed order"}
                </p>
                <p className="text-xs text-ink/40 font-mono">
                  {fmtDate(order.createdAt)}
                  {order.deductedFromDeposit && (
                    <span className="text-ledger ml-2">· deducted from deposit</span>
                  )}
                </p>
              </div>
              <select
                value={order.status}
                onChange={(e) => updateOrder(order.id, { status: e.target.value })}
                className={`text-xs font-mono uppercase tracking-wide border border-line rounded-md px-2 py-1 bg-paper ${
                  order.status === "fulfilled"
                    ? "text-sage"
                    : order.status === "cancelled"
                    ? "text-brick"
                    : "text-ledger"
                }`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="receipt-tear" />

            <div className="space-y-1 text-sm">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {item.qty} {item.unit ? `${item.unit}${item.qty === 1 ? "" : "s"}` : "×"}{" "}
                    {item.name}
                  </span>
                  <span className="font-mono text-ink/70">
                    {(item.qty * (Number(item.price) || 0)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {order.notes && (
              <p className="text-sm text-ink/50 italic mt-2">{order.notes}</p>
            )}

            <div className="receipt-tear" />

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  if (confirm("Delete this order?")) deleteOrder(order.id);
                }}
                className="text-xs text-brick/70 hover:text-brick"
              >
                Delete
              </button>
              <span className="font-mono text-lg">
                {(order.total || 0).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
