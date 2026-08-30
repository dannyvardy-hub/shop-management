"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import {
  watchDepositAgents,
  addDepositAgent,
  deleteDepositAgent,
  watchMyDeposit,
  addMyDeposit,
} from "@/lib/data";
import AgentAutocomplete from "@/components/AgentAutocomplete";
import MoneyInput from "@/components/MoneyInput";
import { fmtMoney } from "@/lib/format";

export default function MyDepositPage() {
  const [agents, setAgents] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState(null);
  const [amount, setAmount] = useState(0);
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

  // Total is defined strictly as the sum of the balances actually shown
  // below, per existing agent — not raw ledger entries (which could include
  // leftovers from a deleted agent).
  const totalBalance = useMemo(
    () => agents.reduce((sum, a) => sum + (balances[a.id] || 0), 0),
    [agents, balances]
  );

  async function topUp() {
    if (!amount || !picked?.name) return;
    setSaving(true);
    try {
      let agentId = picked.id;
      let agentName = picked.name;
      if (!agentId) {
        const ref = await addDepositAgent({ name: agentName });
        agentId = ref.id;
      }
      await addMyDeposit({ agentId, agentName, amount: Math.abs(amount), note });
      setPicked(null);
      setAmount(0);
      setNote("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Wallet size={22} className="text-ledger" strokeWidth={1.75} />
        <h1 className="font-display text-3xl">My Deposit</h1>
      </div>
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
          UGX {fmtMoney(totalBalance)}
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
          <div className="w-36">
            <label className="block text-xs text-ink/50 mb-1">Amount (UGX)</label>
            <MoneyInput
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
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
                {fmtMoney(bal)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-ink/30 mt-2">
        To remove an agent, use Settings.
      </p>
    </div>
  );
}
