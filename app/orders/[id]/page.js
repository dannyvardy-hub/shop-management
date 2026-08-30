"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileText, Download } from "lucide-react";
import {
  watchOrders,
  approveOrder,
  markReceived,
  confirmReceived,
  completeOrderWithTax,
  piecesFor,
  watchDepositAgents,
  watchMyDeposit,
  addDepositAgent,
} from "@/lib/data";
import { downloadOrderPdf } from "@/lib/pdf";
import AgentAutocomplete from "@/components/AgentAutocomplete";
import MoneyInput from "@/components/MoneyInput";
import { fmtMoney, fmtInt } from "@/lib/format";
import { useConfirm } from "@/lib/useConfirm";

function fmtDate(ts) {
  if (!ts?.toDate) return "—";
  return ts.toDate().toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STEPS = ["pending", "approved", "received", "confirmed", "completed"];

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(false);
  const [taxPerDozen, setTaxPerDozen] = useState(0);
  const [agents, setAgents] = useState([]);
  const [depositEntries, setDepositEntries] = useState([]);
  const [approveAgent, setApproveAgent] = useState(null);
  const [taxAgent, setTaxAgent] = useState(null);
  const { confirm, dialog } = useConfirm();

  useEffect(() => watchOrders(setOrders), []);
  useEffect(() => watchDepositAgents(setAgents), []);
  useEffect(() => watchMyDeposit(null, setDepositEntries), []);

  const agentBalances = {};
  for (const e of depositEntries) {
    agentBalances[e.agentId] = (agentBalances[e.agentId] || 0) + e.amount;
  }
  const order = orders.find((o) => o.id === id);

  if (orders.length && !order) {
    return <p className="text-sm text-ink/40">Order not found.</p>;
  }
  if (!order) return <p className="text-sm text-ink/40">Loading…</p>;

  const stepIndex = STEPS.indexOf(order.status);

  async function run(fn) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  async function ensureAgent(picked) {
    if (picked.id) return picked;
    const ref = await addDepositAgent({ name: picked.name });
    return { id: ref.id, name: picked.name };
  }

  async function handleApprove() {
    const ok = await confirm(
      `Approve this order?\nUGX ${fmtMoney(order.subtotalUgx)} will be deducted from ${approveAgent.name}'s deposit.`
    );
    if (!ok) return;
    run(async () => {
      const agent = await ensureAgent(approveAgent);
      await approveOrder(order, agent);
    });
  }

  async function handleMarkReceived() {
    const ok = await confirm("Mark this order as received? Today's date will be recorded.");
    if (!ok) return;
    run(() => markReceived(order.id));
  }

  async function handleConfirmReceived() {
    const ok = await confirm("Confirm this order was received? This locks in a second confirmation date.");
    if (!ok) return;
    run(() => confirmReceived(order.id));
  }

  async function handleCompleteTax() {
    const ok = await confirm(
      `Confirm tax and complete this order?\nUGX ${fmtMoney(taxPerDozen)}/dozen will be deducted from ${taxAgent.name}'s deposit, and the order will be marked completed.`
    );
    if (!ok) return;
    run(async () => {
      const agent = await ensureAgent(taxAgent);
      await completeOrderWithTax(order, taxPerDozen, agent);
    });
  }

  return (
    <div>
      {dialog}
      <button
        onClick={() => router.push("/orders")}
        className="text-xs text-ink/40 hover:text-ink mb-4"
      >
        ← Back to Orders
      </button>

      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-ledger" strokeWidth={1.75} />
          <h1 className="font-display text-3xl">
            {order.label || `Order ${order.id.slice(0, 6)}`}
          </h1>
        </div>
        <button
          onClick={() => downloadOrderPdf(order)}
          className="flex items-center gap-1.5 text-xs border border-line rounded-md px-3 py-1.5 hover:bg-white transition"
        >
          <Download size={14} /> Download PDF
        </button>
      </div>
      <p className="text-ink/50 text-sm mb-6">
        Placed {fmtDate(order.createdAt)}
      </p>

      {/* Progress */}
      <div className="flex items-center gap-1 mb-6 text-[11px] font-mono uppercase tracking-wide">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <span
              className={`px-2 py-1 rounded-md flex-1 text-center ${
                i <= stepIndex ? "bg-ledger text-white" : "bg-paper text-ink/40 border border-line"
              }`}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && <span className="text-ink/20">›</span>}
          </div>
        ))}
      </div>

      <div className="receipt-card p-5 mb-6">
        <div className="space-y-1 text-sm">
          <div className="hidden sm:flex text-[11px] font-mono uppercase tracking-wide text-ink/40 px-0.5">
            <span className="flex-1">Item</span>
            <span className="w-20 text-right">Qty/unit</span>
            <span className="w-16 text-right">Pieces</span>
            <span className="w-24 text-right">KSh/piece</span>
            <span className="w-24 text-right">Line KSh</span>
          </div>
          {order.items?.map((item, idx) => {
            const pieces = piecesFor(item.qty, item.unit);
            const lineTotal = pieces * (Number(item.pricePerPiece) || 0);
            return (
              <div key={idx} className="flex justify-between">
                <span className="flex-1">{item.name}</span>
                <span className="w-20 text-right font-mono text-ink/60">
                  {item.qty} {item.unit}
                </span>
                <span className="w-16 text-right font-mono text-ink/50">{fmtInt(pieces)}</span>
                <span className="w-24 text-right font-mono text-ink/50">
                  {fmtMoney(item.pricePerPiece)}
                </span>
                <span className="w-24 text-right font-mono">{fmtMoney(lineTotal)}</span>
              </div>
            );
          })}
        </div>

        <div className="receipt-tear" />

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-ink/50">Exchange rate</span>
            <span className="font-mono">UGX {fmtMoney(order.exchangeRate)} / KSh</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/50">Subtotal (KSh)</span>
            <span className="font-mono">{fmtMoney(order.subtotalKsh)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/50">Subtotal (UGX)</span>
            <span className="font-mono">{fmtMoney(order.subtotalUgx)}</span>
          </div>
          {order.status === "completed" && (
            <>
              <div className="flex justify-between">
                <span className="text-ink/50">Tax per dozen</span>
                <span className="font-mono">UGX {fmtMoney(order.taxPerDozen)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/50">Total dozens (tax basis)</span>
                <span className="font-mono">{fmtMoney(order.totalDozens)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/50">Tax total</span>
                <span className="font-mono">{fmtMoney(order.taxTotalUgx)}</span>
              </div>
            </>
          )}
        </div>

        <div className="receipt-tear" />

        <div className="flex justify-between items-baseline">
          <span className="text-xs font-mono uppercase tracking-wide text-ink/50">
            {order.status === "completed" ? "Grand total" : "Subtotal so far"}
          </span>
          <span className="font-mono text-2xl">
            UGX{" "}
            {fmtMoney(order.status === "completed" ? order.grandTotalUgx : order.subtotalUgx)}
          </span>
        </div>

        {order.notes && <p className="text-sm text-ink/50 italic mt-3">{order.notes}</p>}
      </div>

      <div className="receipt-card p-5 mb-6 space-y-3 text-sm">
        <p className="text-xs font-mono uppercase tracking-wide text-ink/50">Dates</p>
        <div className="grid sm:grid-cols-2 gap-2">
          <p>Approved: <span className="font-mono">{fmtDate(order.approvedAt)}</span>{order.approvedByAgentName && <span className="text-ink/40"> — {order.approvedByAgentName}</span>}</p>
          <p>Received: <span className="font-mono">{fmtDate(order.receivedAt)}</span></p>
          <p>Confirmed: <span className="font-mono">{fmtDate(order.confirmedAt)}</span></p>
          <p>Completed: <span className="font-mono">{fmtDate(order.completedAt)}</span>{order.taxAgentName && <span className="text-ink/40"> — tax via {order.taxAgentName}</span>}</p>
        </div>
      </div>

      {/* Actions per status */}
      <div className="receipt-card p-5">
        {order.status === "pending" && (
          <div>
            <p className="text-sm text-ink/60 mb-3">
              Approving deducts <span className="font-mono">UGX {fmtMoney(order.subtotalUgx)}</span>{" "}
              from the agent you pick below.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-56">
                <label className="block text-xs font-mono uppercase tracking-wide text-ink/50 mb-1">
                  Deduct from agent
                </label>
                <AgentAutocomplete agents={agents} value={approveAgent} onChange={setApproveAgent} />
                {approveAgent?.id && (
                  <p className="text-xs text-ink/40 mt-1 font-mono">
                    Balance: {fmtMoney(agentBalances[approveAgent.id] || 0)}
                  </p>
                )}
              </div>
              <button
                disabled={busy || !approveAgent?.name}
                onClick={handleApprove}
                className="bg-ledger text-white rounded-md px-5 py-2.5 font-medium hover:bg-ledger/90 transition disabled:opacity-50"
              >
                Approve order
              </button>
            </div>
          </div>
        )}

        {order.status === "approved" && (
          <div>
            <p className="text-sm text-ink/60 mb-3">Mark this order received once it arrives.</p>
            <button
              disabled={busy}
              onClick={handleMarkReceived}
              className="bg-ledger text-white rounded-md px-5 py-2.5 font-medium hover:bg-ledger/90 transition disabled:opacity-50"
            >
              Mark received
            </button>
          </div>
        )}

        {order.status === "received" && (
          <div>
            <p className="text-sm text-ink/60 mb-3">Confirm the received order to proceed to tax.</p>
            <button
              disabled={busy}
              onClick={handleConfirmReceived}
              className="bg-ledger text-white rounded-md px-5 py-2.5 font-medium hover:bg-ledger/90 transition disabled:opacity-50"
            >
              Confirm received
            </button>
          </div>
        )}

        {order.status === "confirmed" && (
          <div>
            <p className="text-sm text-ink/60 mb-3">
              Enter the tax rate per dozen. Bundle quantities are converted to dozens automatically.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wide text-ink/50 mb-1">
                  Tax per dozen (UGX)
                </label>
                <MoneyInput
                  value={taxPerDozen}
                  onChange={setTaxPerDozen}
                  className="w-40 border border-line rounded-md px-3 py-2 bg-paper font-mono focus:outline-none focus:ring-2 focus:ring-ledger/40"
                />
              </div>
              <div className="w-56">
                <label className="block text-xs font-mono uppercase tracking-wide text-ink/50 mb-1">
                  Deduct tax from agent
                </label>
                <AgentAutocomplete agents={agents} value={taxAgent} onChange={setTaxAgent} />
                {taxAgent?.id && (
                  <p className="text-xs text-ink/40 mt-1 font-mono">
                    Balance: {fmtMoney(agentBalances[taxAgent.id] || 0)}
                  </p>
                )}
              </div>
              <button
                disabled={busy || !taxPerDozen || !taxAgent?.name}
                onClick={handleCompleteTax}
                className="bg-ledger text-white rounded-md px-5 py-2.5 font-medium hover:bg-ledger/90 transition disabled:opacity-50"
              >
                Confirm tax & complete order
              </button>
            </div>
          </div>
        )}

        {order.status === "completed" && (
          <p className="text-sm text-sage">This order is fully completed.</p>
        )}
      </div>
      <p className="text-xs text-ink/30 mt-3">To delete this order, use Settings.</p>
    </div>
  );
}
