"use client";

import { useEffect, useMemo, useState } from "react";
import { watchMyDeposit, addMyDeposit, deleteMyDeposit } from "@/lib/data";

function fmtDate(ts) {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MyDepositPage() {
  const [entries, setEntries] = useState([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => watchMyDeposit(setEntries), []);

  const balance = useMemo(
    () => entries.reduce((sum, e) => sum + e.amount, 0),
    [entries]
  );

  async function topUp() {
    const value = Number(amount);
    if (!value) return;
    setSaving(true);
    try {
      await addMyDeposit({ amount: Math.abs(value), note });
      setAmount("");
      setNote("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">My Deposit</h1>
      <p className="text-ink/50 text-sm mb-6">
        Your own float for paying Kenyan orders. Top it up here — approving an order,
        and later confirming its tax, automatically draws it down.
      </p>

      <div className="receipt-card p-5 mb-6">
        <div className="flex items-baseline justify-between mb-4">
          <span className="text-xs font-mono uppercase tracking-wide text-ink/50">
            Balance
          </span>
          <span
            className={`font-mono text-3xl ${
              balance < 0 ? "text-brick" : "text-sage"
            }`}
          >
            UGX {balance.toFixed(2)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-mono uppercase tracking-wide text-ink/50 mb-1">
              Top up amount
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
              placeholder="Where this came from"
            />
          </div>
          <button
            type="button"
            disabled={saving || !amount}
            onClick={topUp}
            className="bg-sage text-white rounded-md px-4 py-2 font-medium hover:bg-sage/90 transition disabled:opacity-50"
          >
            + Top up
          </button>
        </div>
      </div>

      <h2 className="font-display text-xl mb-2">History</h2>
      <div className="receipt-card divide-y divide-line">
        {entries.length === 0 && (
          <p className="px-4 py-3 text-sm text-ink/40">No activity yet.</p>
        )}
        {entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <span className={e.amount < 0 ? "text-brick" : "text-sage"}>
                {e.amount < 0 ? "−" : "+"}
                {Math.abs(e.amount).toFixed(2)}
              </span>
              {e.note && <span className="text-ink/50 ml-2">{e.note}</span>}
              <span className="text-ink/30 ml-2 font-mono text-xs">{fmtDate(e.createdAt)}</span>
            </div>
            {!e.orderId && (
              <button
                onClick={() => {
                  if (confirm("Delete this entry?")) deleteMyDeposit(e.id);
                }}
                className="text-brick/70 hover:text-brick text-xs"
              >
                delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
