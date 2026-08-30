"use client";

import { useMemo, useState, useRef, useEffect } from "react";

export default function AgentAutocomplete({ agents, value, onChange, placeholder }) {
  const [text, setText] = useState(value?.name || "");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    setText(value?.name || "");
  }, [value?.id]);

  const matches = useMemo(() => {
    if (!text.trim()) return agents.slice(0, 6);
    const t = text.toLowerCase();
    return agents.filter((a) => a.name.toLowerCase().includes(t)).slice(0, 6);
  }, [text, agents]);

  const exactMatch = agents.some(
    (a) => a.name.toLowerCase() === text.trim().toLowerCase()
  );

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function choose(agent) {
    onChange(agent);
    setText(agent.name);
    setOpen(false);
  }

  function chooseNew() {
    if (!text.trim()) return;
    onChange({ id: null, name: text.trim() });
    setOpen(false);
  }

  return (
    <div className="relative" ref={boxRef}>
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (matches[0] && text.trim()) choose(matches[0]);
            else chooseNew();
          }
        }}
        placeholder={placeholder || "Type a name…"}
        className="w-full border border-line rounded-md px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-ledger/40"
      />
      {open && text.trim() && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-line rounded-md shadow-md overflow-hidden">
          {matches.map((a) => (
            <button
              type="button"
              key={a.id}
              onClick={() => choose(a)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-paper"
            >
              {a.name}
            </button>
          ))}
          {!exactMatch && (
            <button
              type="button"
              onClick={chooseNew}
              className="w-full text-left px-3 py-2 text-sm text-sage hover:bg-paper border-t border-line"
            >
              + Add “{text.trim()}” as new
            </button>
          )}
        </div>
      )}
    </div>
  );
}
