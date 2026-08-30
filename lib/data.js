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

export const PIECES_PER_DOZEN = 12;
export const PIECES_PER_BUNDLE = 10;

export function piecesFor(qty, unit) {
  const per = unit === "bundle" ? PIECES_PER_BUNDLE : PIECES_PER_DOZEN;
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

// ---------- People (separate from My Deposit) ----------

export function watchPeople(cb) {
  const q = query(collection(db, "people"), orderBy("name"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function addPerson({ name, notes }) {
  return addDoc(collection(db, "people"), {
    name: name.trim(),
    notes: notes?.trim() || "",
    createdAt: serverTimestamp(),
  });
}

export async function updatePerson(id, data) {
  return updateDoc(doc(db, "people", id), data);
}

export async function deletePerson(id) {
  return deleteDoc(doc(db, "people", id));
}

export function watchDeposits(personId, cb) {
  const q = query(collection(db, "deposits"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(personId ? all.filter((d) => d.personId === personId) : all);
  });
}

export async function addDeposit({ personId, amount, note }) {
  return addDoc(collection(db, "deposits"), {
    personId,
    amount: Number(amount),
    note: note?.trim() || "",
    createdAt: serverTimestamp(),
  });
}

export async function deleteDeposit(id) {
  return deleteDoc(doc(db, "deposits", id));
}

// ---------- My Deposit (your own float that orders draw down) ----------
// Positive amount = you topped it up. Negative amount = an order drew it down.

export function watchMyDeposit(cb) {
  const q = query(collection(db, "myDeposit"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function addMyDeposit({ amount, note, orderId }) {
  return addDoc(collection(db, "myDeposit"), {
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

export async function approveOrder(order) {
  await addMyDeposit({
    amount: -Math.abs(order.subtotalUgx),
    note: `Order ${order.id.slice(0, 6)} approved`,
    orderId: order.id,
  });
  await updateDoc(doc(db, "orders", order.id), {
    status: "approved",
    approvedAt: serverTimestamp(),
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

export async function completeOrderWithTax(order, taxPerDozen) {
  const totalDozens = order.items.reduce(
    (sum, i) => sum + piecesFor(i.qty, i.unit) / PIECES_PER_DOZEN,
    0
  );
  const taxTotalUgx = (Number(taxPerDozen) || 0) * totalDozens;
  const grandTotalUgx = order.subtotalUgx + taxTotalUgx;

  await addMyDeposit({
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
    completedAt: serverTimestamp(),
  });
}

export async function deleteOrder(id) {
  await deleteMyDepositEntriesForOrder(id);
  return deleteDoc(doc(db, "orders", id));
}
