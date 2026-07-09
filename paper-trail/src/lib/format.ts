import type {
  DerivedInvoiceStatus,
  Invoice,
  InvoiceItem,
} from "./types";

export function money(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Big-number display without cents when whole (dashboard headline numbers). */
export function moneyBig(amount: number, currency = "USD"): string {
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amount);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  // Parse as a plain calendar date to avoid timezone drift.
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = Date.parse(fromISO.slice(0, 10));
  const b = Date.parse(toISO.slice(0, 10));
  return Math.round((b - a) / 86_400_000);
}

export function invoiceTotal(inv: Pick<Invoice, "items">): number {
  return inv.items.reduce((sum, i) => sum + (i.amount || 0), 0);
}

export function invoiceDueDate(inv: Pick<Invoice, "date" | "net_days">): string {
  return addDays(inv.date, inv.net_days);
}

/** Overdue is derived: past due date and still unpaid. */
export function derivedStatus(inv: Invoice): DerivedInvoiceStatus {
  if (inv.status === "Sent") {
    const due = invoiceDueDate(inv);
    if (daysBetween(todayISO(), due) < 0) return "Overdue";
  }
  return inv.status;
}

export function itemsSorted(items: InvoiceItem[]): InvoiceItem[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

export function padInvoiceNumber(n: number): string {
  return String(n).padStart(4, "0");
}
