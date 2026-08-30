"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { watchDebtors, addDebtor, deleteDebtor, watchCredits, watchDebtorPayments } from "@/lib/data";

export default function DebtorsPage() {
  const [debtors, setDebtors] = useState([]);
  const [credits, setCredits] = useState([]);
  const [payments, setPayments] = useState([]);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = watchDebtors((data) => {
      setDebtors(data);
      setLoading(false);
    });
    return unsub;
  }, []);
  useEffect(() => watchCredits(null, setCredits), []);
  useEffect(() => watchDebtorPayments(null, setPayments), []);

  const balances = useMemo(() => {
    const map = {};
    for (const c of credits) map[c.debtorId] = (map[c.debtorId] || 0) + c.total;
    for (const p of payments) map[p.debtorId] = (map[p.debtorId] || 0) - p.amount;
    return map;
  }, [credits, payments]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await addDebtor({ name, notes });
    setName("");
    setNotes("");
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Debtors</h1>
      <p className="text-ink/50 text-sm mb-6">
        People taking goods on credit. Balances in red are what they still owe you.
      </p>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="flex-1 border border-line rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-ledger/40"
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="flex-1 border border-line rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-ledger/40"
        />
        <button
          type="submit"
          className="bg-ledger text-white rounded-md px-4 py-2 font-medium hover:bg-ledger/90 transition"
        >
          Add
        </button>
      </form>

      {loading && <p className="text-sm text-ink/40">Loading…</p>}
      {!loading && debtors.length === 0 && (
        <p className="text-sm text-ink/40">No one added yet.</p>
      )}

      <div className="receipt-card divide-y divide-line">
        {debtors.map((d) => {
          const bal = balances[d.id] || 0;
          return (
            <div key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <Link href={`/debtors/${d.id}`} className="flex-1 hover:underline">
                <span className="font-medium">{d.name}</span>
                {d.notes && <span className="text-ink/40 ml-2">{d.notes}</span>}
              </Link>
              <span className={`font-mono mr-4 ${bal > 0 ? "text-brick" : "text-ink/40"}`}>
                {bal.toFixed(2)}
              </span>
              <button
                onClick={() => {
                  if (confirm(`Remove ${d.name}? This won't delete their credit history.`))
                    deleteDebtor(d.id);
                }}
                className="text-brick/70 hover:text-brick text-xs"
              >
                delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
