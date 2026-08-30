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

function money(n) {
  return (Number(n) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

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

  // Dates block
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

  // Table header — item | qty | unit | pieces | KSh/pc | KSh/dozen | UGX/pc actual | UGX/pc ceil | line KSh
  const cols = [left, left + 150, left + 195, left + 250, left + 305, left + 375, left + 450, left + 545, left + 640];
  const headers = [
    "Item",
    "Qty",
    "Unit",
    "Pieces",
    "KSh/pc",
    "KSh/dozen",
    "UGX/pc (actual)",
    "UGX/pc (ceil)",
    "Line KSh",
  ];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  headers.forEach((h, i) => doc.text(h, cols[i], y));
  y += 6;
  doc.setDrawColor(200);
  doc.line(left, y, right, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const rate = Number(order.exchangeRate) || 0;
  order.items.forEach((item) => {
    const pieces = piecesFor(item.qty, item.unit);
    const pricePerPiece = Number(item.pricePerPiece) || 0;
    const lineTotal = pieces * pricePerPiece;
    const pricePerDozen = pricePerPiece * PIECES_PER_UNIT.dozen;
    const ugxPerPieceActual = pricePerPiece * rate;
    const ugxPerPieceCeil = Math.ceil(ugxPerPieceActual);

    doc.text(String(item.name), cols[0], y, { maxWidth: 145 });
    doc.text(String(item.qty), cols[1], y);
    doc.text(item.unit, cols[2], y);
    doc.text(String(pieces), cols[3], y);
    doc.text(money(pricePerPiece), cols[4], y);
    doc.text(money(pricePerDozen), cols[5], y);
    doc.text(money(ugxPerPieceActual), cols[6], y);
    doc.text(money(ugxPerPieceCeil), cols[7], y);
    doc.text(money(lineTotal), cols[8], y);
    y += 16;
  });

  y += 6;
  doc.setDrawColor(200);
  doc.line(left, y, right, y);
  y += 20;

  const totalsRows = [
    ["Exchange rate (UGX per KSh)", money(order.exchangeRate)],
    ["Subtotal (KSh)", money(order.subtotalKsh)],
    ["Subtotal (UGX)", money(order.subtotalUgx)],
  ];
  if (order.status === "completed") {
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
  const grand =
    order.status === "completed" ? order.grandTotalUgx : order.subtotalUgx;
  doc.text(
    order.status === "completed" ? "Grand total (UGX)" : "Subtotal so far (UGX)",
    left,
    y
  );
  doc.text(money(grand), left + 260, y, { align: "right" });
  y += 24;

  if (order.notes) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text(`Notes: ${order.notes}`, left, y, { maxWidth: 600 });
  }

  doc.save(`order-${order.id.slice(0, 6)}.pdf`);
}
