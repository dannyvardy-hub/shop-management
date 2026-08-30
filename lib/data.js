"use client";

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";

// ---------- Unit conversion ----------

export const PIECES_PER_UNIT = {
  piece: 1,
  "half-dozen": 6,
  dozen: 12,
  bundle: 10,
};

export function piecesFor(qty, unit) {
  const per = PIECES_PER_UNIT[unit] ?? 1;
  return (Number(qty) || 0) * per;
}

// ---------- Products ----------

export function watchProducts(cb) {
  const q = query(collection(db, "products"), orderBy("name"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function addProduct({ name, price, unit }) {
  return addDoc(collection(db, "products"), {
    name: name.trim(),
    price: price ?? null,
    unit: unit?.trim() || "",
    createdAt: serverTimestamp(),
  });
}

export async function updateProduct(id, data) {
  return updateDoc(doc(db, "products", id), data);
}

export async function deleteProduct(id) {
  return deleteDoc(doc(db, "products", id));
}

// ---------- Debtors (people who take goods on credit) ----------

export function watchDebtors(cb) {
  const q = query(collection(db, "debtors"), orderBy("name"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function addDebtor({ name, notes }) {
  return addDoc(collection(db, "debtors"), {
    name: name.trim(),
    notes: notes?.trim() || "",
    createdAt: serverTimestamp(),
  });
}

export async function updateDebtor(id, data) {
  return updateDoc(doc(db, "debtors", id), data);
}

export async function deleteDebtor(id) {
  return deleteDoc(doc(db, "debtors", id));
}

// Credits: itemized goods given on credit. Increases what a debtor owes.
export function watchCredits(debtorId, cb) {
  const q = query(collection(db, "credits"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(debtorId ? all.filter((c) => c.debtorId === debtorId) : all);
  });
}

export async function addCredit({ debtorId, items }) {
  const total = items.reduce(
    (sum, i) => sum + (Number(i.qty) || 0) * (Number(i.price) || 0),
    0
  );
  return addDoc(collection(db, "credits"), {
    debtorId,
    items,
    total,
    createdAt: serverTimestamp(),
  });
}

export async function deleteCredit(id) {
  return deleteDoc(doc(db, "credits", id));
}

// Payments: reduce what a debtor owes.
export function watchDebtorPayments(debtorId, cb) {
  const q = query(collection(db, "debtorPayments"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(debtorId ? all.filter((p) => p.debtorId === debtorId) : all);
  });
}

export async function addDebtorPayment({ debtorId, amount, note }) {
  return addDoc(collection(db, "debtorPayments"), {
    debtorId,
    amount: Math.abs(Number(amount) || 0),
    note: note?.trim() || "",
    createdAt: serverTimestamp(),
  });
}

export async function deleteDebtorPayment(id) {
  return deleteDoc(doc(db, "debtorPayments", id));
}

// ---------- Deposit agents (people you deposit money to for orders) ----------

export function watchDepositAgents(cb) {
  const q = query(collection(db, "depositAgents"), orderBy("name"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function addDepositAgent({ name }) {
  return addDoc(collection(db, "depositAgents"), {
    name: name.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function deleteDepositAgent(id) {
  return deleteDoc(doc(db, "depositAgents", id));
}

// ---------- My Deposit (per-agent float that orders draw down) ----------
// Positive amount = you topped that agent's balance up.
// Negative amount = an order drew it down (approval or tax).

export function watchMyDeposit(agentId, cb) {
  const q = query(collection(db, "myDeposit"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(agentId ? all.filter((e) => e.agentId === agentId) : all);
  });
}

export async function addMyDeposit({ agentId, agentName, amount, note, orderId }) {
  return addDoc(collection(db, "myDeposit"), {
    agentId,
    agentName: agentName || "",
    amount: Number(amount),
    note: note?.trim() || "",
    orderId: orderId || null,
    createdAt: serverTimestamp(),
  });
}

export async function deleteMyDeposit(id) {
  return deleteDoc(doc(db, "myDeposit", id));
}

async function deleteMyDepositEntriesForOrder(orderId) {
  const snap = await getDocs(collection(db, "myDeposit"));
  const toDelete = snap.docs.filter((d) => d.data().orderId === orderId);
  await Promise.all(toDelete.map((d) => deleteDoc(doc(db, "myDeposit", d.id))));
}

// ---------- Orders ----------
// Lifecycle: pending -> approved -> received -> confirmed -> completed

export function watchOrders(cb) {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function addOrder({ label, notes, items, exchangeRate }) {
  const subtotalKsh = items.reduce(
    (sum, i) => sum + piecesFor(i.qty, i.unit) * (Number(i.pricePerPiece) || 0),
    0
  );
  const subtotalUgx = subtotalKsh * (Number(exchangeRate) || 0);

  return addDoc(collection(db, "orders"), {
    label: label?.trim() || "",
    notes: notes?.trim() || "",
    items,
    exchangeRate: Number(exchangeRate) || 0,
    subtotalKsh,
    subtotalUgx,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function approveOrder(order, agent) {
  await addMyDeposit({
    agentId: agent.id,
    agentName: agent.name,
    amount: -Math.abs(order.subtotalUgx),
    note: `Order ${order.id.slice(0, 6)} approved`,
    orderId: order.id,
  });
  await updateDoc(doc(db, "orders", order.id), {
    status: "approved",
    approvedAt: serverTimestamp(),
    approvedByAgentId: agent.id,
    approvedByAgentName: agent.name,
  });
}

export async function markReceived(orderId) {
  await updateDoc(doc(db, "orders", orderId), {
    status: "received",
    receivedAt: serverTimestamp(),
  });
}

export async function confirmReceived(orderId) {
  await updateDoc(doc(db, "orders", orderId), {
    status: "confirmed",
    confirmedAt: serverTimestamp(),
  });
}

export async function completeOrderWithTax(order, taxPerDozen, agent) {
  const totalDozens = order.items.reduce(
    (sum, i) => sum + piecesFor(i.qty, i.unit) / PIECES_PER_UNIT.dozen,
    0
  );
  const taxTotalUgx = (Number(taxPerDozen) || 0) * totalDozens;
  const grandTotalUgx = order.subtotalUgx + taxTotalUgx;

  await addMyDeposit({
    agentId: agent.id,
    agentName: agent.name,
    amount: -Math.abs(taxTotalUgx),
    note: `Order ${order.id.slice(0, 6)} tax`,
    orderId: order.id,
  });

  await updateDoc(doc(db, "orders", order.id), {
    status: "completed",
    taxPerDozen: Number(taxPerDozen) || 0,
    totalDozens,
    taxTotalUgx,
    grandTotalUgx,
    taxAgentId: agent.id,
    taxAgentName: agent.name,
    completedAt: serverTimestamp(),
  });
}

export async function deleteOrder(id) {
  await deleteMyDepositEntriesForOrder(id);
  return deleteDoc(doc(db, "orders", id));
}
