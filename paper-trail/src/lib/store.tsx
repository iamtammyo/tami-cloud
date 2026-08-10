"use client";

import { useSyncExternalStore } from "react";
import type {
  Brand,
  Contact,
  Database,
  Deal,
  Deliverable,
  Invoice,
  InvoiceItem,
  PaymentMethod,
  Profile,
} from "./types";
import { seedData } from "./seed";
import { itemsSorted, padInvoiceNumber } from "./format";

const KEY = "paper-trail.v1";

// --- id helper (client-only; avoids Math.random collisions well enough for local use) ---
let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}

// --- persistence ---
function load(): Database {
  if (typeof window === "undefined") return seedData();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const seeded = seedData();
      localStorage.setItem(KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as Database;
  } catch {
    return seedData();
  }
}

let state: Database | null = null;
const listeners = new Set<() => void>();

function ensure(): Database {
  if (state === null) state = load();
  return state;
}

function commit(next: Database) {
  state = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const serverSnapshot = seedData();

export function useDatabase(): Database {
  return useSyncExternalStore(subscribe, ensure, () => serverSnapshot);
}

// --- generic helpers ---
export function resetToSeed() {
  commit(seedData());
}

// --- Profile ---
export function saveProfile(patch: Partial<Profile>) {
  const db = ensure();
  commit({ ...db, profile: { ...db.profile, ...patch } });
}

// --- Payment methods ---
export function savePaymentMethod(pm: Omit<PaymentMethod, "id"> & { id?: string }) {
  const db = ensure();
  let methods = [...db.payment_methods];
  const id = pm.id ?? uid("pm");
  const record: PaymentMethod = { ...pm, id };
  const idx = methods.findIndex((m) => m.id === id);
  if (idx >= 0) methods[idx] = record;
  else methods.push(record);
  // Enforce a single default.
  if (record.is_default) {
    methods = methods.map((m) => ({ ...m, is_default: m.id === id }));
  } else if (!methods.some((m) => m.is_default) && methods.length) {
    methods[0] = { ...methods[0], is_default: true };
  }
  commit({ ...db, payment_methods: methods });
  return id;
}

export function deletePaymentMethod(id: string) {
  const db = ensure();
  let methods = db.payment_methods.filter((m) => m.id !== id);
  if (methods.length && !methods.some((m) => m.is_default)) {
    methods = methods.map((m, i) => ({ ...m, is_default: i === 0 }));
  }
  commit({ ...db, payment_methods: methods });
}

// --- Brands ---
export function saveBrand(
  brand: Omit<Brand, "id" | "contacts"> & {
    id?: string;
    contacts: (Omit<Contact, "id"> & { id?: string })[];
  }
) {
  const db = ensure();
  const id = brand.id ?? uid("brand");
  const record: Brand = {
    ...brand,
    id,
    contacts: brand.contacts.map((c) => ({ ...c, id: c.id ?? uid("c") })),
  };
  const brands = [...db.brands];
  const idx = brands.findIndex((b) => b.id === id);
  if (idx >= 0) brands[idx] = record;
  else brands.push(record);
  commit({ ...db, brands });
  return id;
}

export function deleteBrand(id: string) {
  const db = ensure();
  commit({ ...db, brands: db.brands.filter((b) => b.id !== id) });
}

// --- Deals ---
export function saveDeal(
  deal: Omit<
    Deal,
    | "id"
    | "created_at"
    | "deliverables"
    | "payment_schedule"
    | "contract_file_url"
    | "contract_file_name"
  > & {
    id?: string;
    created_at?: string;
    deliverables?: Deliverable[];
    payment_schedule?: Deal["payment_schedule"];
    contract_file_url?: string | null;
    contract_file_name?: string | null;
  }
) {
  const db = ensure();
  const id = deal.id ?? uid("deal");
  const existing = db.deals.find((d) => d.id === id);
  const record: Deal = {
    ...deal,
    id,
    created_at: deal.created_at ?? existing?.created_at ?? new Date().toISOString().slice(0, 10),
    deliverables: deal.deliverables ?? existing?.deliverables ?? [],
    payment_schedule: deal.payment_schedule ?? existing?.payment_schedule ?? [],
    contract_file_url: deal.contract_file_url ?? existing?.contract_file_url ?? null,
    contract_file_name: deal.contract_file_name ?? existing?.contract_file_name ?? null,
  };
  const deals = [...db.deals];
  const idx = deals.findIndex((d) => d.id === id);
  if (idx >= 0) deals[idx] = record;
  else deals.push(record);
  commit({ ...db, deals });
  return id;
}

export function setDealStatus(id: string, status: Deal["status"]) {
  const db = ensure();
  commit({
    ...db,
    deals: db.deals.map((d) => (d.id === id ? { ...d, status } : d)),
  });
}

export function deleteDeal(id: string) {
  const db = ensure();
  commit({ ...db, deals: db.deals.filter((d) => d.id !== id) });
}

export function saveDeliverable(
  dealId: string,
  del: Omit<Deliverable, "id"> & { id?: string }
) {
  const db = ensure();
  const deals = db.deals.map((d) => {
    if (d.id !== dealId) return d;
    const id = del.id ?? uid("del");
    const record: Deliverable = { ...del, id };
    const deliverables = [...d.deliverables];
    const idx = deliverables.findIndex((x) => x.id === id);
    if (idx >= 0) deliverables[idx] = record;
    else deliverables.push(record);
    return { ...d, deliverables };
  });
  commit({ ...db, deals });
}

export function deleteDeliverable(dealId: string, delId: string) {
  const db = ensure();
  const deals = db.deals.map((d) =>
    d.id === dealId
      ? { ...d, deliverables: d.deliverables.filter((x) => x.id !== delId) }
      : d
  );
  commit({ ...db, deals });
}

export function setDealPaymentSchedule(dealId: string, schedule: Deal["payment_schedule"]) {
  const db = ensure();
  commit({
    ...db,
    deals: db.deals.map((d) =>
      d.id === dealId ? { ...d, payment_schedule: schedule } : d
    ),
  });
}

export function attachContract(dealId: string, fileName: string, dataUrl: string) {
  const db = ensure();
  commit({
    ...db,
    deals: db.deals.map((d) =>
      d.id === dealId
        ? { ...d, contract_file_name: fileName, contract_file_url: dataUrl }
        : d
    ),
  });
}

// --- Invoices ---
export function nextInvoiceNumber(): string {
  return padInvoiceNumber(ensure().profile.next_invoice_number);
}

export function saveInvoice(
  invoice: Omit<Invoice, "id" | "items"> & {
    id?: string;
    items: (Omit<InvoiceItem, "id" | "sort_order"> & {
      id?: string;
      sort_order?: number;
    })[];
  }
) {
  const db = ensure();
  const id = invoice.id ?? uid("inv");
  const isNew = !db.invoices.some((i) => i.id === id);
  const record: Invoice = {
    ...invoice,
    id,
    items: invoice.items.map((it, i) => ({
      ...it,
      id: it.id ?? uid("it"),
      sort_order: it.sort_order ?? i,
    })),
  };
  const invoices = [...db.invoices];
  const idx = invoices.findIndex((i) => i.id === id);
  if (idx >= 0) invoices[idx] = record;
  else invoices.push(record);

  let profile = db.profile;
  // If this new invoice consumed the running number, advance it.
  if (isNew && record.number === padInvoiceNumber(db.profile.next_invoice_number)) {
    profile = { ...db.profile, next_invoice_number: db.profile.next_invoice_number + 1 };
  }
  commit({ ...db, invoices, profile });
  return id;
}

export function setInvoiceStatus(
  id: string,
  status: Invoice["status"],
  opts?: { sent_at?: string | null; paid_at?: string | null }
) {
  const db = ensure();
  commit({
    ...db,
    invoices: db.invoices.map((i) =>
      i.id === id
        ? {
            ...i,
            status,
            sent_at: opts?.sent_at !== undefined ? opts.sent_at : i.sent_at,
            paid_at: opts?.paid_at !== undefined ? opts.paid_at : i.paid_at,
          }
        : i
    ),
  });
}

export function deleteInvoice(id: string) {
  const db = ensure();
  commit({ ...db, invoices: db.invoices.filter((i) => i.id !== id) });
}

export function duplicateInvoice(id: string): string | null {
  const db = ensure();
  const src = db.invoices.find((i) => i.id === id);
  if (!src) return null;
  const number = nextInvoiceNumber();
  return saveInvoice({
    ...src,
    id: undefined,
    number,
    status: "Draft",
    sent_at: null,
    paid_at: null,
    items: itemsSorted(src.items).map((it) => ({ ...it, id: undefined })),
  });
}
