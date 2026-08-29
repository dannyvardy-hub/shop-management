"use client";

import { useMemo, useState, useRef, useEffect } from "react";

export default function ProductAutocomplete({ products, onPick, placeholder }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const matches = useMemo(() => {
    if (!text.trim()) return products.slice(0, 6);
    const t = text.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(t)).slice(0, 6);
  }, [text, products]);

  const exactMatch = products.some(
    (p) => p.name.toLowerCase() === text.trim().toLowerCase()
  );

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function choose(product) {
    onPick(product);
    setText("");
    setOpen(false);
  }

  function chooseNew() {
    if (!text.trim()) return;
    onPick({ id: null, name: text.trim(), price: null, unit: "" });
    setText("");
    setOpen(false);
  }

  return (
    <div className="relative" ref={boxRef}>
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (matches[0] && text.trim()) {
              choose(matches[0]);
            } else {
              chooseNew();
            }
          }
        }}
        placeholder={placeholder || "Type an item name…"}
        className="w-full border border-line rounded-md px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-ledger/40"
      />
      {open && text.trim() && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-line rounded-md shadow-md overflow-hidden">
          {matches.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => choose(p)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-paper flex justify-between"
            >
              <span>{p.name}</span>
              {p.price != null && (
                <span className="font-mono text-ink/50">
                  {p.price.toFixed(2)}
                </span>
              )}
            </button>
          ))}
          {!exactMatch && (
            <button
              type="button"
              onClick={chooseNew}
              className="w-full text-left px-3 py-2 text-sm text-sage hover:bg-paper border-t border-line"
            >
              + Add “{text.trim()}” as a new item
            </button>
          )}
        </div>
      )}
    </div>
  );
}
