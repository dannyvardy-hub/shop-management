"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  watchDebtors,
  watchCredits,
  addCredit,
  deleteCredit,
  watchDebtorPayments,
  addDebtorPayment,
  deleteDebtorPayment,
  watchProducts,
  addProduct,
} from "@/lib/data";
import ProductAutocomplete from "@/components/ProductAutocomplete";
import MoneyInput from "@/components/MoneyInput";
import { fmtMoney } from "@/lib/format";
import { useConfirm } from "@/lib/useConfirm";

function fmtDate(ts) {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const UNIT_LABEL = { piece: "piece", "half-dozen": "half-dozen", dozen: "dozen" };

export default function DebtorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [debtors, setDebtors] = useState([]);
  const [credits, setCredits] = useState([]);
  const [payments, setPayments] = useState([]);
  const [products, setProducts] = useState([]);

  const [cartItems, setCartItems] = useState([]);
  const [savingCredit, setSavingCredit] = useState(false);

  const [payAmount, setPayAmount] = useState(0);
  const [payNote, setPayNote] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const { confirm, dialog } = useConfirm();

  useEffect(() => watchDebtors(setDebtors), []);
  useEffect(() => watchCredits(id, setCredits), [id]);
  useEffect(() => watchDebtorPayments(id, setPayments), [id]);
  useEffect(() => watchProducts(setProducts), []);

  const debtor = debtors.find((d) => d.id === id);
  const balance = useMemo(
    () =>
      credits.reduce((sum, c) => sum + c.total, 0) -
      payments.reduce((sum, p) => sum + p.amount, 0),
    [credits, payments]
  );

  async function handlePick(product) {
    let productId = product.id;
    if (!productId) {
      const ref = await addProduct({ name: product.name, price: null, unit: "" });
      productId = ref.id;
    }
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        { productId, name: product.name, qty: 1, unit: "dozen", price: 0 },
      ];
    });
  }

  function updateCartItem(productId, field, value) {
    setCartItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, [field]: value } : i))
    );
  }

  function removeCartItem(productId) {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  const cartTotal = cartItems.reduce(
    (sum, i) => sum + (Number(i.qty) || 0) * (Number(i.price) || 0),
    0
  );

  async function handleCreateCredit() {
    if (cartItems.length === 0) return;
    const ok = await confirm(
      `Create this credit for ${debtor?.name}?\n${cartItems.length} item(s) · Total ${fmtMoney(cartTotal)}\n\nThis adds to what they owe you.`
    );
    if (!ok) return;
    setSavingCredit(true);
    try {
      await addCredit({ debtorId: id, items: cartItems });
      setCartItems([]);
    } finally {
      setSavingCredit(false);
    }
  }

  async function handleRecordPayment() {
    if (!payAmount) return;
    setSavingPayment(true);
    try {
      await addDebtorPayment({ debtorId: id, amount: payAmount, note: payNote });
      setPayAmount(0);
      setPayNote("");
    } finally {
      setSavingPayment(false);
    }
  }

  if (debtors.length && !debtor) {
    return <p className="text-sm text-ink/40">Debtor not found.</p>;
  }

  return (
    <div>
      {dialog}
      <button onClick={() => router.push("/debtors")} className="text-xs text-ink/40 hover:text-ink mb-4">
        ← Back to Debtors
      </button>
      <h1 className="font-display text-3xl mb-1">{debtor?.name || "…"}</h1>
      {debtor?.notes && <p className="text-ink/50 text-sm mb-4">{debtor.notes}</p>}

      <div className="receipt-card p-5 mb-6 flex items-baseline justify-between">
        <span className="text-xs font-mono uppercase tracking-wide text-ink/50">
          Balance owed
        </span>
        <span className={`font-mono text-3xl ${balance > 0 ? "text-brick" : "text-ink/40"}`}>
          {fmtMoney(balance)}
        </span>
      </div>

      {/* Take goods on credit */}
      <div className="receipt-card p-5 mb-6">
        <p className="text-xs font-mono uppercase tracking-wide text-ink/50 mb-3">
          Take goods on credit
        </p>
        <ProductAutocomplete products={products} onPick={handlePick} placeholder="Add an item…" />

        {cartItems.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="hidden sm:flex text-[11px] font-mono uppercase tracking-wide text-ink/40 px-0.5">
              <span className="flex-1">Item</span>
              <span className="w-14 text-right">Qty</span>
              <span className="w-28">Priced per</span>
              <span className="w-24 text-right">Price</span>
              <span className="w-24 text-right">Line total</span>
              <span className="w-12" />
            </div>
            {cartItems.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 text-sm">
                <span className="flex-1">{item.name}</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={item.qty}
                  onChange={(e) => updateCartItem(item.productId, "qty", Number(e.target.value))}
                  className="w-14 border border-line rounded-md px-2 py-1 font-mono bg-paper text-right"
                />
                <select
                  value={item.unit}
                  onChange={(e) => updateCartItem(item.productId, "unit", e.target.value)}
                  className="w-28 border border-line rounded-md px-1.5 py-1 bg-paper text-xs"
                >
                  <option value="piece">per piece</option>
                  <option value="half-dozen">per half-dozen</option>
                  <option value="dozen">per dozen</option>
                </select>
                <MoneyInput
                  value={item.price}
                  onChange={(v) => updateCartItem(item.productId, "price", v)}
                  className="w-24 border border-line rounded-md px-2 py-1 font-mono bg-paper text-right"
                />
                <span className="w-24 text-right font-mono text-ink/70">
                  {fmtMoney((Number(item.qty) || 0) * (Number(item.price) || 0))}
                </span>
                <button
                  type="button"
                  onClick={() => removeCartItem(item.productId)}
                  className="w-12 text-brick/70 hover:text-brick text-xs text-right"
                >
                  remove
                </button>
              </div>
            ))}

            <div className="receipt-tear" />
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-mono uppercase tracking-wide text-ink/50">
                Credit total
              </span>
              <span className="font-mono text-xl text-brick">{fmtMoney(cartTotal)}</span>
            </div>
            <button
              type="button"
              disabled={savingCredit}
              onClick={handleCreateCredit}
              className="bg-brick text-white rounded-md px-5 py-2.5 font-medium hover:bg-brick/90 transition disabled:opacity-50"
            >
              {savingCredit ? "Saving…" : "Create credit"}
            </button>
          </div>
        )}
      </div>

      {/* Record payment */}
      <div className="receipt-card p-5 mb-6">
        <p className="text-xs font-mono uppercase tracking-wide text-ink/50 mb-3">
          Record a payment
        </p>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="w-32">
            <label className="block text-xs text-ink/50 mb-1">Amount</label>
            <MoneyInput
              value={payAmount}
              onChange={setPayAmount}
              className="w-full border border-line rounded-md px-3 py-2 bg-paper font-mono focus:outline-none focus:ring-2 focus:ring-ledger/40"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-ink/50 mb-1">Note (optional)</label>
            <input
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-ledger/40"
            />
          </div>
          <button
            type="button"
            disabled={savingPayment || !payAmount}
            onClick={handleRecordPayment}
            className="bg-sage text-white rounded-md px-4 py-2 font-medium hover:bg-sage/90 transition disabled:opacity-50"
          >
            Record payment
          </button>
        </div>
      </div>

      <h2 className="font-display text-xl mb-2">Credit history</h2>
      <div className="receipt-card divide-y divide-line mb-6">
        {credits.length === 0 && <p className="px-4 py-3 text-sm text-ink/40">No credit given yet.</p>}
        {credits.map((c) => (
          <div key={c.id} className="px-4 py-3 text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-ink/30 font-mono text-xs">{fmtDate(c.createdAt)}</span>
              <div className="flex items-center gap-3">
                <span className="text-brick font-mono">+{fmtMoney(c.total)}</span>
                <button
                  onClick={() => {
                    if (confirm("Delete this credit entry?")) deleteCredit(c.id);
                  }}
                  className="text-brick/70 hover:text-brick text-xs"
                >
                  delete
                </button>
              </div>
            </div>
            <div className="text-ink/60 text-xs space-y-0.5">
              {c.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {item.qty} × {item.name} ({UNIT_LABEL[item.unit] || item.unit})
                  </span>
                  <span className="font-mono">
                    {fmtMoney((Number(item.qty) || 0) * (Number(item.price) || 0))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-display text-xl mb-2">Payment history</h2>
      <div className="receipt-card divide-y divide-line">
        {payments.length === 0 && <p className="px-4 py-3 text-sm text-ink/40">No payments recorded yet.</p>}
        {payments.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <span className="text-sage font-mono">−{fmtMoney(p.amount)}</span>
              {p.note && <span className="text-ink/50 ml-2">{p.note}</span>}
              <span className="text-ink/30 ml-2 font-mono text-xs">{fmtDate(p.createdAt)}</span>
            </div>
            <button
              onClick={() => {
                if (confirm("Delete this payment entry?")) deleteDebtorPayment(p.id);
              }}
              className="text-brick/70 hover:text-brick text-xs"
            >
              delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
