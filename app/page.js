"use client";

import { useEffect, useState } from "react";
import { watchProducts, addProduct, addOrder, piecesFor } from "@/lib/data";
import ProductAutocomplete from "@/components/ProductAutocomplete";

export default function NewOrderPage() {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => watchProducts(setProducts), []);

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
        {
          productId,
          name: product.name,
          qty: 1,
          unit: "dozen",
          pricePerPiece: price ?? 0,
        },
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

  const subtotalKsh = items.reduce(
    (sum, i) => sum + piecesFor(i.qty, i.unit) * (Number(i.pricePerPiece) || 0),
    0
  );
  const rate = Number(exchangeRate) || 0;
  const subtotalUgx = subtotalKsh * rate;

  async function handleSubmit(e) {
    e.preventDefault();
    if (items.length === 0 || !rate) return;
    setSaving(true);
    try {
      await addOrder({ label, notes, items, exchangeRate: rate });
      setItems([]);
      setLabel("");
      setNotes("");
      setExchangeRate("");
      setSavedMsg("Order placed — approve it from the Orders tab to draw on My Deposit.");
      setTimeout(() => setSavedMsg(""), 4000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">New order</h1>
      <p className="text-ink/50 text-sm mb-6">
        Add items by price per piece and quantity in dozens or bundles (1 bundle = {" "}
        {"10"} pieces). Tax comes later, once the order arrives.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="receipt-card p-5">
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-ink/50 mb-1">
                Order label (optional)
              </label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-ledger/40"
                placeholder="e.g. August restock"
              />
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
                <span className="w-24">Unit</span>
                <span className="w-16 text-right">Pieces</span>
                <span className="w-24 text-right">KSh/piece</span>
                <span className="w-24 text-right">Line KSh</span>
                <span className="w-12" />
              </div>
              {items.map((item) => {
                const pieces = piecesFor(item.qty, item.unit);
                const lineTotal = pieces * (Number(item.pricePerPiece) || 0);
                return (
                  <div key={item.productId} className="flex items-center gap-2 text-sm">
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
                      className="w-24 border border-line rounded-md px-1.5 py-1 bg-paper text-xs"
                    >
                      <option value="dozen">dozen (12)</option>
                      <option value="bundle">bundle (10)</option>
                    </select>
                    <span className="w-16 text-right font-mono text-ink/50 text-xs">
                      {pieces}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.pricePerPiece}
                      onChange={(e) =>
                        updateItem(item.productId, "pricePerPiece", Number(e.target.value))
                      }
                      className="w-24 border border-line rounded-md px-2 py-1 font-mono bg-paper text-right"
                    />
                    <span className="w-24 text-right font-mono text-ink/70">
                      {lineTotal.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="w-12 text-brick/70 hover:text-brick text-xs text-right"
                    >
                      remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="receipt-tear" />

          <div className="grid sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-ink/50 mb-1">
                Exchange rate — UGX per 1 KSh
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="e.g. 27.50"
                className="w-full border border-line rounded-md px-3 py-2 bg-paper font-mono focus:outline-none focus:ring-2 focus:ring-ledger/40"
              />
            </div>
            <div className="text-right">
              <p className="text-xs font-mono uppercase tracking-wide text-ink/50">
                Subtotal (KSh {subtotalKsh.toFixed(2)})
              </p>
              <p className="font-mono text-2xl">
                UGX {subtotalUgx.toFixed(2)}
              </p>
              <p className="text-xs text-ink/40">Tax not included yet</p>
            </div>
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
            placeholder="Supplier details, delivery notes…"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={items.length === 0 || !rate || saving}
            className="bg-ledger text-white rounded-md px-5 py-2.5 font-medium hover:bg-ledger/90 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Place order"}
          </button>
          {savedMsg && <span className="text-sage text-sm">{savedMsg}</span>}
        </div>
      </form>
    </div>
  );
}
