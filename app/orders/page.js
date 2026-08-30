"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ListOrdered } from "lucide-react";
import { watchOrders } from "@/lib/data";
import { fmtMoney } from "@/lib/format";

const STATUS_STYLE = {
  pending: "text-ink/50",
  approved: "text-ledger",
  received: "text-sage",
  confirmed: "text-sage",
  completed: "text-sage",
};

function fmtDate(ts) {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
      <div className="flex items-center gap-2 mb-1">
        <ListOrdered size={22} className="text-ledger" strokeWidth={1.75} />
        <h1 className="font-display text-3xl">Orders</h1>
      </div>
      <p className="text-ink/50 text-sm mb-6">
        Every order, newest first. Tap one to approve, mark received, or add tax.
      </p>

      {loading && <p className="text-sm text-ink/40">Loading…</p>}
      {!loading && orders.length === 0 && (
        <p className="text-sm text-ink/40">
          Nothing here yet — place your first order from the New order tab.
        </p>
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="receipt-card p-4 flex items-center justify-between hover:shadow-sm transition block"
          >
            <div>
              <p className="font-medium">
                {order.label || `Order ${order.id.slice(0, 6)}`}
              </p>
              <p className="text-xs text-ink/40 font-mono">
                {order.items?.length || 0} item(s) · {fmtDate(order.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-xs font-mono uppercase tracking-wide ${
                  STATUS_STYLE[order.status] || "text-ink/50"
                }`}
              >
                {order.status}
              </p>
              <p className="font-mono">
                UGX{" "}
                {fmtMoney(
                  order.status === "completed" ? order.grandTotalUgx : order.subtotalUgx
                )}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
