"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { watchProducts, addProduct, updateProduct } from "@/lib/data";
import MoneyInput from "@/components/MoneyInput";
import { fmtMoney } from "@/lib/format";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);

  useEffect(() => {
    const unsub = watchProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await addProduct({ name, price: price || null });
    setName("");
    setPrice(0);
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Package size={22} className="text-ledger" strokeWidth={1.75} />
        <h1 className="font-display text-3xl">Products</h1>
      </div>
      <p className="text-ink/50 text-sm mb-6">
        Items you've used in orders end up here automatically. Manage them, or add one ahead of time.
      </p>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          className="flex-1 border border-line rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-ledger/40"
        />
        <MoneyInput
          value={price}
          onChange={setPrice}
          placeholder="Default price"
          className="w-36 border border-line rounded-md px-3 py-2 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-ledger/40"
        />
        <button
          type="submit"
          className="bg-ledger text-white rounded-md px-4 py-2 font-medium hover:bg-ledger/90 transition"
        >
          Add
        </button>
      </form>

      {loading && <p className="text-sm text-ink/40">Loading…</p>}
      {!loading && products.length === 0 && (
        <p className="text-sm text-ink/40">
          No products yet — they'll appear here the first time you use them in an order.
        </p>
      )}

      <div className="receipt-card divide-y divide-line">
        {products.map((p) => (
          <ProductRow key={p.id} product={p} />
        ))}
      </div>
      <p className="text-xs text-ink/30 mt-2">To remove a product, use Settings.</p>
    </div>
  );
}

function ProductRow({ product }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price ?? 0);

  async function save() {
    await updateProduct(product.id, {
      name: name.trim(),
      price: price || null,
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-4 py-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 border border-line rounded-md px-2 py-1 bg-paper"
        />
        <MoneyInput
          value={price}
          onChange={setPrice}
          className="w-28 border border-line rounded-md px-2 py-1 font-mono bg-paper"
        />
        <button onClick={save} className="text-sage text-sm px-2">
          Save
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-ink/40 text-sm px-2"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span>{product.name}</span>
      <div className="flex items-center gap-4">
        <span className="font-mono text-ink/50">
          {product.price != null ? fmtMoney(product.price) : "—"}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="text-ledger/70 hover:text-ledger text-xs"
        >
          edit
        </button>
      </div>
    </div>
  );
}
