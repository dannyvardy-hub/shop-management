"use client";

import { useEffect, useState } from "react";
import { watchProducts, addProduct, updateProduct, deleteProduct } from "@/lib/data";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

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
    await addProduct({ name, price: price === "" ? null : Number(price) });
    setName("");
    setPrice("");
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Products</h1>
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
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          type="number"
          step="0.01"
          min="0"
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
    </div>
  );
}

function ProductRow({ product }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price ?? "");

  async function save() {
    await updateProduct(product.id, {
      name: name.trim(),
      price: price === "" ? null : Number(price),
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
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          type="number"
          step="0.01"
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
          {product.price != null ? product.price.toFixed(2) : "—"}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="text-ledger/70 hover:text-ledger text-xs"
        >
          edit
        </button>
        <button
          onClick={() => {
            if (confirm(`Remove "${product.name}" from products?`))
              deleteProduct(product.id);
          }}
          className="text-brick/70 hover:text-brick text-xs"
        >
          delete
        </button>
      </div>
    </div>
  );
}
