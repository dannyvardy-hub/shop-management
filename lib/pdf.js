"use client";

import { jsPDF } from "jspdf";
import { piecesFor, PIECES_PER_UNIT } from "./data";

function fmtDate(ts) {
  if (!ts?.toDate) return "—";
  return ts.toDate().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtDateTime(ts) {
  if (!ts?.toDate) return "—";
  return ts.toDate().toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function money(n) {
  return (Number(n) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ---------- Order summary PDF ----------

export function downloadOrderPdf(order) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const left = 40;
  const right = 800;
  let y = 50;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Order summary", left, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`Order ${order.id.slice(0, 6)}${order.label ? " — " + order.label : ""}`, left, y);
  y += 22;
  doc.setTextColor(0);

  const dateRows = [
    ["Placed", fmtDate(order.createdAt)],
    ["Approved", fmtDate(order.approvedAt)],
    ["Received", fmtDate(order.receivedAt)],
    ["Confirmed", fmtDate(order.confirmedAt)],
    ["Completed", fmtDate(order.completedAt)],
  ];
  doc.setFontSize(9);
  dateRows.forEach(([label, val], i) => {
    doc.text(`${label}: ${val}`, left + i * 150, y);
  });
  y += 18;

  if (order.approvedByAgentName || order.taxAgentName) {
    doc.setFontSize(9);
    doc.setTextColor(90);
    const agentLine = [
      order.approvedByAgentName ? `Approved via: ${order.approvedByAgentName}` : null,
      order.taxAgentName ? `Tax paid via: ${order.taxAgentName}` : null,
    ]
      .filter(Boolean)
      .join("   ·   ");
    doc.text(agentLine, left, y);
    y += 16;
    doc.setTextColor(0);
  }
  y += 10;

  const completed = order.status === "completed";
  const rate = Number(order.exchangeRate) || 0;
  const taxPerDozen = Number(order.taxPerDozen) || 0;

  const cols = completed
    ? [left, left + 130, left + 175, left + 225, left + 300, left + 400, left + 500, left + 600, left + 700]
    : [left, left + 200, left + 280, left + 360, left + 460];
  const headers = completed
    ? [
        "Item",
        "Qty",
        "Unit",
        "Pieces",
        "UGX/piece (actual)",
        "UGX/piece (ceiling)",
        "UGX/dozen (actual)",
        "UGX/dozen (ceiling)",
        "Line KSh",
      ]
    : ["Item", "Qty", "Unit", "Pieces", "Line KSh"];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  headers.forEach((h, i) => doc.text(h, cols[i], y));
  y += 6;
  doc.setDrawColor(200);
  doc.line(left, y, right, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  order.items.forEach((item) => {
    const pieces = piecesFor(item.qty, item.unit);
    const pricePerPiece = Number(item.pricePerPiece) || 0;
    const lineTotal = pieces * pricePerPiece;

    doc.text(String(item.name), cols[0], y, { maxWidth: completed ? 125 : 190 });
    doc.text(String(item.qty), cols[1], y);
    doc.text(item.unit, cols[2], y);
    doc.text(String(pieces), cols[3], y);

    if (completed) {
      // Grand-total-derived pricing: subtotal conversion plus this item's
      // share of tax (tax is levied uniformly per dozen, so the tax added
      // per piece is the same across every item: taxPerDozen / 12).
      const dozenUgxActual = pricePerPiece * rate * PIECES_PER_UNIT.dozen + taxPerDozen;
      const dozenUgxCeil = Math.ceil(dozenUgxActual);
      const pieceUgxActual = dozenUgxActual / PIECES_PER_UNIT.dozen;
      const pieceUgxCeil = Math.ceil(pieceUgxActual);

      doc.text(money(pieceUgxActual), cols[4], y);
      doc.text(money(pieceUgxCeil), cols[5], y);
      doc.text(money(dozenUgxActual), cols[6], y);
      doc.text(money(dozenUgxCeil), cols[7], y);
      doc.text(money(lineTotal), cols[8], y);
    } else {
      doc.text(money(lineTotal), cols[4], y);
    }
    y += 16;
  });

  if (!completed) {
    y += 4;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      "Final per-piece / per-dozen UGX pricing appears here once the order is completed (tax entered).",
      left,
      y
    );
    doc.setTextColor(0);
  }

  y += 12;
  doc.setDrawColor(200);
  doc.line(left, y, right, y);
  y += 20;

  const totalsRows = [
    ["Exchange rate (UGX per KSh)", money(order.exchangeRate)],
    ["Subtotal (KSh)", money(order.subtotalKsh)],
    ["Subtotal (UGX)", money(order.subtotalUgx)],
  ];
  if (completed) {
    totalsRows.push(["Tax per dozen (UGX)", money(order.taxPerDozen)]);
    totalsRows.push(["Total dozens (tax basis)", money(order.totalDozens)]);
    totalsRows.push(["Tax total (UGX)", money(order.taxTotalUgx)]);
  }

  doc.setFontSize(10);
  totalsRows.forEach(([label, val]) => {
    doc.text(label, left, y);
    doc.text(val, left + 260, y, { align: "right" });
    y += 16;
  });

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  const grand = completed ? order.grandTotalUgx : order.subtotalUgx;
  doc.text(completed ? "Grand total (UGX)" : "Subtotal so far (UGX)", left, y);
  doc.text(money(grand), left + 260, y, { align: "right" });
  y += 24;

  if (order.notes) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text(`Notes: ${order.notes}`, left, y, { maxWidth: 600 });
  }

  doc.save(`order-${order.id.slice(0, 6)}.pdf`);
}

// ---------- Debtor summary PDF ----------

const UNIT_LABEL = { piece: "piece", "half-dozen": "half-dozen", dozen: "dozen" };

export function downloadDebtorPdf(debtor, credits, payments) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 48;
  const right = 547;
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Debtor summary", left, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(debtor.name, left, y);
  y += 4;
  if (debtor.notes) {
    y += 14;
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(debtor.notes, left, y);
    doc.setTextColor(0);
  }
  y += 24;

  const balance =
    credits.reduce((sum, c) => sum + c.total, 0) -
    payments.reduce((sum, p) => sum + p.amount, 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Balance owed", left, y);
  doc.text(money(balance), right, y, { align: "right" });
  y += 26;

  // Credits
  doc.setFontSize(12);
  doc.text("Goods taken on credit", left, y);
  y += 16;
  doc.setDrawColor(200);
  doc.line(left, y, right, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (credits.length === 0) {
    doc.setTextColor(120);
    doc.text("No credit given yet.", left, y);
    doc.setTextColor(0);
    y += 16;
  }
  credits.forEach((c) => {
    doc.setFont("helvetica", "bold");
    doc.text(fmtDateTime(c.createdAt), left, y);
    doc.text(`+${money(c.total)}`, right, y, { align: "right" });
    y += 13;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90);
    c.items.forEach((item) => {
      const lineTotal = (Number(item.qty) || 0) * (Number(item.price) || 0);
      doc.text(
        `  ${item.qty} × ${item.name} (${UNIT_LABEL[item.unit] || item.unit})`,
        left,
        y
      );
      doc.text(money(lineTotal), right, y, { align: "right" });
      y += 12;
    });
    doc.setTextColor(0);
    y += 6;
  });

  y += 10;

  // Payments
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Payments", left, y);
  y += 16;
  doc.setDrawColor(200);
  doc.line(left, y, right, y);
  y += 14;

  doc.setFontSize(9);
  if (payments.length === 0) {
    doc.setTextColor(120);
    doc.text("No payments recorded yet.", left, y);
    doc.setTextColor(0);
    y += 16;
  }
  payments.forEach((p) => {
    doc.text(fmtDateTime(p.createdAt) + (p.note ? `  —  ${p.note}` : ""), left, y);
    // Payments reduce the debt, so they're shown with a negative sign.
    doc.text(`-${money(p.amount)}`, right, y, { align: "right" });
    y += 15;
  });

  doc.save(`debtor-${debtor.id.slice(0, 6)}.pdf`);
}
