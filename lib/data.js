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
} from "firebase/firestore";
import { db } from "./firebase";

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

// ---------- People ----------

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

// ---------- Deposits ----------
// A deposit doc with a positive amount = money/credit you gave them.
// A negative amount = credit used up (e.g. an order deducted from it).

export function watchDeposits(personId, cb) {
  const q = query(
    collection(db, "deposits"),
    orderBy("createdAt", "desc")
  );
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

// ---------- Orders ----------

export function watchOrders(cb) {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function addOrder({
  customerName,
  notes,
  items,
  total,
  status,
  personId,
  personName,
  deductFromDeposit,
}) {
  const ref = await addDoc(collection(db, "orders"), {
    customerName: customerName?.trim() || "",
    notes: notes?.trim() || "",
    items,
    total,
    status: status || "open",
    personId: personId || null,
    personName: personName || "",
    deductedFromDeposit: !!deductFromDeposit,
    createdAt: serverTimestamp(),
  });

  if (deductFromDeposit && personId) {
    await addDeposit({
      personId,
      amount: -Math.abs(total),
      note: `Order ${ref.id.slice(0, 6)}`,
    });
  }

  return ref;
}

export async function updateOrder(id, data) {
  return updateDoc(doc(db, "orders", id), data);
}

export async function deleteOrder(id) {
  return deleteDoc(doc(db, "orders", id));
}
