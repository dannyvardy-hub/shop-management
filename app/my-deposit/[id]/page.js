"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { watchDepositAgents, watchMyDeposit, addMyDeposit } from "@/lib/data";
import MoneyInput from "@/components/MoneyInput";
import { fmtMoney } from "@/lib/format";

function fmtDate(ts) {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AgentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [agents, setAgents] = useState([]);
  const [entries, setEntries] = useState([]);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => watchDepositAgents(setAgents), []);
  useEffect(() => watchMyDeposit(id, setEntries), [id]);

  const agent = agents.find((a) => a.id === id);
  const balance = useMemo(() => entries.reduce((sum, e) => sum + e.amount, 0), [entries]);

  async function topUp() {
    if (!amount || !agent) return;
    setSaving(true);
    try {
      await addMyDeposit({ agentId: id, agentName: agent.name, amount: Math.abs(amount), note });
      setAmount(0);
      setNote("");
    } finally {
      setSaving(false);
    }
  }

  if (agents.length && !agent) {
    return <p className="text-sm text-ink/40">Agent not found.</p>;
  }

  return (
    <div>
      <button onClick={() => router.push("/my-deposit")} className="text-xs text-ink/40 hover:text-ink mb-4">
        ← Back to My Deposit
      </button>
      <h1 className="font-display text-3xl mb-6">{agent?.name || "…"}</h1>

      <div className="receipt-card p-5 mb-6">
        <div className="flex items-baseline justify-between mb-4">
          <span className="text-xs font-mono uppercase tracking-wide text-ink/50">Balance</span>
          <span className={`font-mono text-2xl ${balance < 0 ? "text-brick" : "text-sage"}`}>
            UGX {fmtMoney(balance)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-mono uppercase tracking-wide text-ink/50 mb-1">
              Top up amount
            </label>
            <MoneyInput
              value={amount}
              onChange={setAmount}
              className="w-full border border-line rounded-md px-3 py-2 bg-paper font-mono focus:outline-none focus:ring-2 focus:ring-ledger/40"
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
        {entries.length === 0 && <p className="px-4 py-3 text-sm text-ink/40">No activity yet.</p>}
        {entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <span className={e.amount < 0 ? "text-brick" : "text-sage"}>
                {e.amount < 0 ? "−" : "+"}
                {fmtMoney(Math.abs(e.amount))}
              </span>
              {e.note && <span className="text-ink/50 ml-2">{e.note}</span>}
              <span className="text-ink/30 ml-2 font-mono text-xs">{fmtDate(e.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
