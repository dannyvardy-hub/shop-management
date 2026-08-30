"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  watchDepositAgents,
  addDepositAgent,
  deleteDepositAgent,
  watchMyDeposit,
  addMyDeposit,
} from "@/lib/data";
import AgentAutocomplete from "@/components/AgentAutocomplete";

export default function MyDepositPage() {
  const [agents, setAgents] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = watchDepositAgents((data) => {
      setAgents(data);
      setLoading(false);
    });
    return unsub;
  }, []);
  useEffect(() => watchMyDeposit(null, setEntries), []);

  const balances = useMemo(() => {
    const map = {};
    for (const e of entries) {
      map[e.agentId] = (map[e.agentId] || 0) + e.amount;
    }
    return map;
  }, [entries]);

  const totalBalance = useMemo(
    () => entries.reduce((sum, e) => sum + e.amount, 0),
    [entries]
  );

  async function topUp() {
    const value = Number(amount);
    if (!value || !picked?.name) return;
    setSaving(true);
    try {
      let agentId = picked.id;
      let agentName = picked.name;
      if (!agentId) {
        const ref = await addDepositAgent({ name: agentName });
        agentId = ref.id;
      }
      await addMyDeposit({ agentId, agentName, amount: Math.abs(value), note });
      setPicked(null);
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
        Money you've deposited with agents to pay for orders. Approving an
        order, and later confirming its tax, draws down whichever agent you
        pick at that moment.
      </p>

      <div className="receipt-card p-5 mb-6 flex items-baseline justify-between">
        <span className="text-xs font-mono uppercase tracking-wide text-ink/50">
          Total across all agents
        </span>
        <span className={`font-mono text-2xl ${totalBalance < 0 ? "text-brick" : "text-sage"}`}>
          UGX {totalBalance.toFixed(2)}
        </span>
      </div>

      <div className="receipt-card p-5 mb-6">
        <p className="text-xs font-mono uppercase tracking-wide text-ink/50 mb-3">
          Top up an agent
        </p>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-ink/50 mb-1">Agent</label>
            <AgentAutocomplete agents={agents} value={picked} onChange={setPicked} />
          </div>
          <div className="w-32">
            <label className="block text-xs text-ink/50 mb-1">Amount (UGX)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 bg-paper font-mono focus:outline-none focus:ring-2 focus:ring-ledger/40"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-ink/50 mb-1">Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-ledger/40"
            />
          </div>
          <button
            type="button"
            disabled={saving || !amount || !picked?.name}
            onClick={topUp}
            className="bg-sage text-white rounded-md px-4 py-2 font-medium hover:bg-sage/90 transition disabled:opacity-50"
          >
            + Top up
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-ink/40">Loading…</p>}
      {!loading && agents.length === 0 && (
        <p className="text-sm text-ink/40">No agents yet — top one up above to add them.</p>
      )}

      <div className="receipt-card divide-y divide-line">
        {agents.map((a) => {
          const bal = balances[a.id] || 0;
          return (
            <div key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <Link href={`/my-deposit/${a.id}`} className="flex-1 hover:underline font-medium">
                {a.name}
              </Link>
              <span className={`font-mono mr-4 ${bal < 0 ? "text-brick" : "text-sage"}`}>
                {bal.toFixed(2)}
              </span>
              <button
                onClick={() => {
                  if (confirm(`Remove ${a.name}? This won't delete their deposit history.`))
                    deleteDepositAgent(a.id);
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
