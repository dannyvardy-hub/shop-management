"use client";

import { useState, useEffect } from "react";

function formatDisplay(raw) {
  if (raw === "" || raw === null || raw === undefined) return "";
  const str = String(raw);
  const neg = str.startsWith("-");
  const body = neg ? str.slice(1) : str;
  const [intPart, decPart] = body.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (neg ? "-" : "") + withCommas + (decPart !== undefined ? "." + decPart : "");
}

export default function MoneyInput({ value, onChange, placeholder, className }) {
  const [raw, setRaw] = useState(value || value === 0 ? String(value) : "");

  useEffect(() => {
    const numRaw = parseFloat(raw.replace(/,/g, "")) || 0;
    if (Number(value) !== numRaw) {
      setRaw(value || value === 0 ? String(value) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleChange(e) {
    const v = e.target.value.replace(/,/g, "");
    if (!/^-?\d*\.?\d*$/.test(v)) return;
    setRaw(v);
    const parsed = v === "" || v === "-" || v === "." ? 0 : parseFloat(v);
    onChange(isNaN(parsed) ? 0 : parsed);
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={formatDisplay(raw)}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
}
