"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { watchPeople, addPerson, deletePerson, watchDeposits } from "@/lib/data";

export default function PeoplePage() {
  const [people, setPeople] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = watchPeople((data) => {
      setPeople(data);
      setLoading(false);
    });
    return unsub;
  }, []);
  useEffect(() => watchDeposits(null, setDeposits), []);

  const balances = useMemo(() => {
    const map = {};
    for (const d of deposits) {
      map[d.personId] = (map[d.personId] || 0) + d.amount;
    }
    return map;
  }, [deposits]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await addPerson({ name, notes });
    setName("");
    setNotes("");
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">People</h1>
      <p className="text-ink/50 text-sm mb-6">
        People you lend items to. Each has a deposit balance you can top up or draw down.
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
      {!loading && people.length === 0 && (
        <p className="text-sm text-ink/40">No one added yet.</p>
      )}

      <div className="receipt-card divide-y divide-line">
        {people.map((p) => {
          const bal = balances[p.id] || 0;
          return (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <Link href={`/people/${p.id}`} className="flex-1 hover:underline">
                <span className="font-medium">{p.name}</span>
                {p.notes && <span className="text-ink/40 ml-2">{p.notes}</span>}
              </Link>
              <span
                className={`font-mono mr-4 ${
                  bal < 0 ? "text-brick" : bal > 0 ? "text-sage" : "text-ink/40"
                }`}
              >
                {bal.toFixed(2)}
              </span>
              <button
                onClick={() => {
                  if (confirm(`Remove ${p.name}? This won't delete their past orders.`))
                    deletePerson(p.id);
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
