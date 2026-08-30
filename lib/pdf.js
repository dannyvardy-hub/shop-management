"use client";

import { jsPDF } from "jspdf";
import { piecesFor } from "./data";

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
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 48;
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Order summary", left, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`Order ${order.id.slice(0, 6)}${order.label ? " — " + order.label : ""}`, left, y);
  y += 24;
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
    doc.text(`${label}: ${val}`, left + (i % 3) * 170, y + Math.floor(i / 3) * 14);
  });
  y += Math.ceil(dateRows.length / 3) * 14 + 4;

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
    y += 14;
    doc.setTextColor(0);
  }
  y += 12;

  // Table header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const cols = [left, left + 170, left + 240, left + 310, left + 390, left + 470];
  doc.text("Item", cols[0], y);
  doc.text("Qty", cols[1], y);
  doc.text("Unit", cols[2], y);
  doc.text("Pieces", cols[3], y);
  doc.text("Price/pc", cols[4], y);
  doc.text("Total KSh", cols[5], y);
  y += 6;
  doc.setDrawColor(200);
  doc.line(left, y, 547, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  order.items.forEach((item) => {
    const pieces = piecesFor(item.qty, item.unit);
    const lineTotal = pieces * (Number(item.pricePerPiece) || 0);
    doc.text(String(item.name), cols[0], y, { maxWidth: 160 });
    doc.text(String(item.qty), cols[1], y);
    doc.text(item.unit, cols[2], y);
    doc.text(String(pieces), cols[3], y);
    doc.text(money(item.pricePerPiece), cols[4], y);
    doc.text(money(lineTotal), cols[5], y);
    y += 16;
  });

  y += 8;
  doc.setDrawColor(200);
  doc.line(left, y, 547, y);
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
    doc.text(val, 480, y, { align: "right" });
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
  doc.text(money(grand), 480, y, { align: "right" });
  y += 24;

  if (order.notes) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text(`Notes: ${order.notes}`, left, y, { maxWidth: 500 });
  }

  doc.save(`order-${order.id.slice(0, 6)}.pdf`);
}
