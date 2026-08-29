"use client";

import { useEffect, useMemo, useState } from "react";
import { watchProducts, addProduct, addOrder, watchPeople, watchDeposits } from "@/lib/data";
import ProductAutocomplete from "@/components/ProductAutocomplete";

export default function NewOrderPage() {
  const [products, setProducts] = useState([]);
  const [people, setPeople] = useState([]);
  const [items, setItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [personId, setPersonId] = useState("");
  const [deductFromDeposit, setDeductFromDeposit] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [deposits, setDeposits] = useState([]);

  useEffect(() => watchProducts(setProducts), []);
  useEffect(() => watchPeople(setPeople), []);
  useEffect(() => watchDeposits(null, setDeposits), []);

  const selectedPerson = people.find((p) => p.id === personId);
  const balance = useMemo(() => {
    if (!personId) return 0;
    return deposits
      .filter((d) => d.personId === personId)
      .reduce((sum, d) => sum + d.amount, 0);
  }, [deposits, personId]);

  async function handlePick(product) {
    let productId = product.id;
    let price = product.price;

    // Brand new item the user typed — remember it for next time.
    if (!productId) {
      const ref = await addProduct({ name: product.name, price: null, unit: "" });
      productId = ref.id;
      price = null;
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        { productId, name: product.name, qty: 1, unit: "dozen", price: price ?? 0 },
      ];
    });
  }

  function updateItem(productId, field, value) {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, [field]: value } : i
      )
    );
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  const total = items.reduce((sum, i) => sum + i.qty * (Number(i.price) || 0), 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (items.length === 0) return;
    setSaving(true);
    try {
      await addOrder({
        customerName: selectedPerson ? selectedPerson.name : customerName,
        notes,
        items,
        total,
        status: "open",
        personId: personId || null,
        personName: selectedPerson?.name || "",
        deductFromDeposit: !!personId && deductFromDeposit,
      });
      setItems([]);
      setCustomerName("");
      setPersonId("");
      setDeductFromDeposit(false);
      setNotes("");
      setSavedMsg("Order saved.");
      setTimeout(() => setSavedMsg(""), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">New order</h1>
      <p className="text-ink/50 text-sm mb-6">
        Add items below — start typing to reuse a saved item, or add a new one on the fly.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="receipt-card p-5">
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-ink/50 mb-1">
                Person (optional)
              </label>
              <select
                value={personId}
                onChange={(e) => {
                  setPersonId(e.target.value);
                  setDeductFromDeposit(false);
                }}
                className="w-full border border-line rounded-md px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-ledger/40"
              >
                <option value="">— No one in particular —</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {!personId && (
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full mt-2 border border-line rounded-md px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-ledger/40"
                  placeholder="Or just type a name (optional)"
                />
              )}
              {personId && (
                <div className="mt-2 flex items-center justify-between text-xs bg-paper border border-line rounded-md px-3 py-2">
                  <span className="text-ink/50">
                    Deposit balance:{" "}
                    <span className="font-mono text-ink">{balance.toFixed(2)}</span>
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deductFromDeposit}
                      onChange={(e) => setDeductFromDeposit(e.target.checked)}
                    />
                    Deduct from deposit
                  </label>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-ink/50 mb-1">
                Add item
              </label>
              <ProductAutocomplete products={products} onPick={handlePick} />
            </div>
          </div>

          <div className="receipt-tear" />

          {items.length === 0 ? (
            <p className="text-sm text-ink/40 py-6 text-center">
              No items yet — add one above.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono uppercase tracking-wide text-ink/40 px-0.5">
                <span className="flex-1">Item</span>
                <span className="w-14 text-right">Qty</span>
                <span className="w-20">Unit</span>
                <span className="w-24 text-right">Price/unit</span>
                <span className="w-20 text-right">Line total</span>
                <span className="w-12" />
              </div>
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="flex-1">{item.name}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={item.qty}
                    onChange={(e) =>
                      updateItem(item.productId, "qty", Number(e.target.value))
                    }
                    className="w-14 border border-line rounded-md px-2 py-1 font-mono bg-paper text-right"
                  />
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(item.productId, "unit", e.target.value)}
                    className="w-20 border border-line rounded-md px-1.5 py-1 bg-paper text-xs"
                  >
                    <option value="dozen">dozen</option>
                    <option value="each">each</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.price}
                    onChange={(e) =>
                      updateItem(item.productId, "price", Number(e.target.value))
                    }
                    className="w-24 border border-line rounded-md px-2 py-1 font-mono bg-paper text-right"
                  />
                  <span className="w-20 text-right font-mono text-ink/70">
                    {(item.qty * (Number(item.price) || 0)).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="w-12 text-brick/70 hover:text-brick text-xs text-right"
                  >
                    remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="receipt-tear" />

          <div className="flex justify-between items-baseline">
            <span className="text-xs font-mono uppercase tracking-wide text-ink/50">
              Total
            </span>
            <span className="font-mono text-2xl">{total.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wide text-ink/50 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full border border-line rounded-md px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-ledger/40"
            placeholder="Delivery details, special requests…"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={items.length === 0 || saving}
            className="bg-ledger text-white rounded-md px-5 py-2.5 font-medium hover:bg-ledger/90 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save order"}
          </button>
          {savedMsg && <span className="text-sage text-sm">{savedMsg}</span>}
        </div>
      </form>
    </div>
  );
}
