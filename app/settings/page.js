"use client";

import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Trash2 } from "lucide-react";
import {
  watchProducts,
  deleteProduct,
  watchDebtors,
  deleteDebtor,
  watchDepositAgents,
  deleteDepositAgent,
  watchOrders,
  deleteOrder,
} from "@/lib/data";
import { fmtMoney } from "@/lib/format";
import { useConfirm } from "@/lib/useConfirm";

function Section({ title, emptyText, items, renderRow }) {
  return (
    <div className="mb-8">
      <h2 className="font-display text-xl mb-2">{title}</h2>
      <div className="receipt-card divide-y divide-line">
        {items.length === 0 && (
          <p className="px-4 py-3 text-sm text-ink/40">{emptyText}</p>
        )}
        {items.map(renderRow)}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [products, setProducts] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [agents, setAgents] = useState([]);
  const [orders, setOrders] = useState([]);
  const { confirm, dialog } = useConfirm();

  useEffect(() => watchProducts(setProducts), []);
  useEffect(() => watchDebtors(setDebtors), []);
  useEffect(() => watchDepositAgents(setAgents), []);
  useEffect(() => watchOrders(setOrders), []);

  async function handleDelete(kind, id, label, fn) {
    const ok = await confirm(`Delete ${kind} "${label}"? This can't be undone.`);
    if (!ok) return;
    await fn(id);
  }

  return (
    <div>
      {dialog}
      <div className="flex items-center gap-2 mb-1">
        <SettingsIcon size={22} className="text-ledger" strokeWidth={1.75} />
        <h1 className="font-display text-3xl">Settings</h1>
      </div>
      <p className="text-ink/50 text-sm mb-8">
        Remove products, debtors, agents, or orders. Every delete here asks
        you to confirm first.
      </p>

      <Section
        title="Products"
        emptyText="No products yet."
        items={products}
        renderRow={(p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>{p.name}</span>
            <button
              onClick={() => handleDelete("product", p.id, p.name, deleteProduct)}
              className="text-brick/70 hover:text-brick flex items-center gap-1 text-xs"
            >
              <Trash2 size={13} /> delete
            </button>
          </div>
        )}
      />

      <Section
        title="Debtors"
        emptyText="No debtors yet."
        items={debtors}
        renderRow={(d) => (
          <div key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>{d.name}</span>
            <button
              onClick={() => handleDelete("debtor", d.id, d.name, deleteDebtor)}
              className="text-brick/70 hover:text-brick flex items-center gap-1 text-xs"
            >
              <Trash2 size={13} /> delete
            </button>
          </div>
        )}
      />

      <Section
        title="Deposit agents"
        emptyText="No agents yet."
        items={agents}
        renderRow={(a) => (
          <div key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>{a.name}</span>
            <button
              onClick={() => handleDelete("agent", a.id, a.name, deleteDepositAgent)}
              className="text-brick/70 hover:text-brick flex items-center gap-1 text-xs"
            >
              <Trash2 size={13} /> delete
            </button>
          </div>
        )}
      />

      <Section
        title="Orders"
        emptyText="No orders yet."
        items={orders}
        renderRow={(o) => (
          <div key={o.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <span>{o.label || `Order ${o.id.slice(0, 6)}`}</span>
              <span className="text-ink/40 ml-2 font-mono text-xs">
                UGX {fmtMoney(o.status === "completed" ? o.grandTotalUgx : o.subtotalUgx)}
              </span>
            </div>
            <button
              onClick={() =>
                handleDelete(
                  "order",
                  o.id,
                  o.label || o.id.slice(0, 6),
                  async (id) => {
                    await deleteOrder(id);
                  }
                )
              }
              className="text-brick/70 hover:text-brick flex items-center gap-1 text-xs"
            >
              <Trash2 size={13} /> delete
            </button>
          </div>
        )}
      />
      <p className="text-xs text-ink/30">
        Deleting an order also reverses any My Deposit amounts it drew down.
      </p>
    </div>
  );
}
