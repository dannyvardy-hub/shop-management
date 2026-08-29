"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  watchPeople,
  watchDeposits,
  addDeposit,
  deleteDeposit,
  watchOrders,
} from "@/lib/data";

function fmtDate(ts) {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PersonDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [people, setPeople] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [orders, setOrders] = useState([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => watchPeople(setPeople), []);
  useEffect(() => watchDeposits(id, setDeposits), [id]);
  useEffect(() => watchOrders(setOrders), []);

  const person = people.find((p) => p.id === id);
  const personOrders = orders.filter((o) => o.personId === id);
  const balance = useMemo(
    () => deposits.reduce((sum, d) => sum + d.amount, 0),
    [deposits]
  );

  async function handleAdjust(sign) {
    const value = Number(amount);
    if (!value) return;
    setSaving(true);
    try {
      await addDeposit({ personId: id, amount: sign * Math.abs(value), note });
      setAmount("");
      setNote("");
    } finally {
      setSaving(false);
    }
  }

  if (people.length && !person) {
    return <p className="text-sm text-ink/40">Person not found.</p>;
  }

  return (
    <div>
      <button
        onClick={() => router.push("/people")}
        className="text-xs text-ink/40 hover:text-ink mb-4"
      >
        ← Back to People
      </button>
      <h1 className="font-display text-3xl mb-1">{person?.name || "…"}</h1>
      {person?.notes && <p className="text-ink/50 text-sm mb-4">{person.notes}</p>}

      <div className="receipt-card p-5 mb-6">
        <div className="flex items-baseline justify-between mb-4">
          <span className="text-xs font-mono uppercase tracking-wide text-ink/50">
            Deposit balance
          </span>
          <span
            className={`font-mono text-2xl ${
              balance < 0 ? "text-brick" : balance > 0 ? "text-sage" : ""
            }`}
          >
            {balance.toFixed(2)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-mono uppercase tracking-wide text-ink/50 mb-1">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 bg-paper font-mono focus:outline-none focus:ring-2 focus:ring-ledger/40"
              placeholder="0.00"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-mono uppercase tracking-wide text-ink/50 mb-1">
              Note (optional)
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-ledger/40"
              placeholder="What's this for?"
            />
          </div>
          <button
            type="button"
            disabled={saving || !amount}
            onClick={() => handleAdjust(1)}
            className="bg-sage text-white rounded-md px-4 py-2 font-medium hover:bg-sage/90 transition disabled:opacity-50"
          >
            + Add deposit
          </button>
          <button
            type="button"
            disabled={saving || !amount}
            onClick={() => handleAdjust(-1)}
            className="bg-brick text-white rounded-md px-4 py-2 font-medium hover:bg-brick/90 transition disabled:opacity-50"
          >
            − Reduce
          </button>
        </div>
      </div>

      <h2 className="font-display text-xl mb-2">Deposit history</h2>
      <div className="receipt-card divide-y divide-line mb-6">
        {deposits.length === 0 && (
          <p className="px-4 py-3 text-sm text-ink/40">No deposits recorded yet.</p>
        )}
        {deposits.map((d) => (
          <div key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <span className={d.amount < 0 ? "text-brick" : "text-sage"}>
                {d.amount < 0 ? "−" : "+"}
                {Math.abs(d.amount).toFixed(2)}
              </span>
              {d.note && <span className="text-ink/50 ml-2">{d.note}</span>}
              <span className="text-ink/30 ml-2 font-mono text-xs">{fmtDate(d.createdAt)}</span>
            </div>
            <button
              onClick={() => {
                if (confirm("Delete this deposit entry?")) deleteDeposit(d.id);
              }}
              className="text-brick/70 hover:text-brick text-xs"
            >
              delete
            </button>
          </div>
        ))}
      </div>

      <h2 className="font-display text-xl mb-2">Orders</h2>
      <div className="receipt-card divide-y divide-line">
        {personOrders.length === 0 && (
          <p className="px-4 py-3 text-sm text-ink/40">No orders for this person yet.</p>
        )}
        {personOrders.map((o) => (
          <div key={o.id} className="px-4 py-3 text-sm flex items-center justify-between">
            <div>
              <span>{o.items?.length || 0} item(s)</span>
              <span className="text-ink/30 ml-2 font-mono text-xs">{fmtDate(o.createdAt)}</span>
              {o.deductedFromDeposit && (
                <span className="ml-2 text-xs text-ledger">deducted from deposit</span>
              )}
            </div>
            <span className="font-mono">{(o.total || 0).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
