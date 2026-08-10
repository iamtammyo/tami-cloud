import type { Database, Deal, Invoice } from "./types";
import {
  daysBetween,
  derivedStatus,
  invoiceDueDate,
  invoiceTotal,
  todayISO,
} from "./format";

export interface NeedsAttentionItem {
  kind: "overdue" | "deliver_soon" | "not_invoiced" | "rights_expiring";
  title: string;
  detail: string;
  href: string;
  amount?: number;
  currency?: string;
  urgency: number; // lower = more urgent (sort ascending)
}

export function brandName(db: Database, brandId: string | null): string {
  return db.brands.find((b) => b.id === brandId)?.name ?? "—";
}

export function dashboardNumbers(db: Database) {
  const today = todayISO();
  const year = today.slice(0, 4);
  const month = today.slice(0, 7);

  let outstanding = 0;
  let overdue = 0;
  let paidThisYear = 0;
  let paidThisMonth = 0;

  for (const inv of db.invoices) {
    const total = invoiceTotal(inv);
    const status = derivedStatus(inv);
    if (status === "Sent" || status === "Overdue") outstanding += total;
    if (status === "Overdue") overdue += total;
    if (inv.status === "Paid" && inv.paid_at) {
      if (inv.paid_at.startsWith(year)) paidThisYear += total;
      if (inv.paid_at.startsWith(month)) paidThisMonth += total;
    }
  }
  return { outstanding, overdue, paidThisYear, paidThisMonth };
}

export function incomeByMonth(db: Database): { month: string; total: number }[] {
  const map = new Map<string, number>();
  for (const inv of db.invoices) {
    if (inv.status === "Paid" && inv.paid_at) {
      const key = inv.paid_at.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + invoiceTotal(inv));
    }
  }
  // Show the trailing 12 months so the chart has a stable shape.
  const out: { month: string; total: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
    out.push({ month: label, total: map.get(key) ?? 0 });
  }
  return out;
}

export function incomeByBrand(db: Database): { name: string; total: number }[] {
  const map = new Map<string, number>();
  for (const inv of db.invoices) {
    if (inv.status === "Paid") {
      const name = brandName(db, inv.brand_id);
      map.set(name, (map.get(name) ?? 0) + invoiceTotal(inv));
    }
  }
  return [...map.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
}

export function needsAttention(db: Database): NeedsAttentionItem[] {
  const today = todayISO();
  const items: NeedsAttentionItem[] = [];

  // Overdue invoices
  for (const inv of db.invoices) {
    if (derivedStatus(inv) === "Overdue") {
      const due = invoiceDueDate(inv);
      const late = -daysBetween(today, due);
      items.push({
        kind: "overdue",
        title: `Invoice ${inv.number} is ${late} day${late === 1 ? "" : "s"} overdue`,
        detail: `${brandName(db, inv.brand_id)} · due ${due}`,
        href: `/invoices/${inv.id}`,
        amount: invoiceTotal(inv),
        currency: inv.currency,
        urgency: -late,
      });
    }
  }

  // Deliverables due within 7 days (and not delivered)
  for (const deal of db.deals) {
    for (const del of deal.deliverables) {
      if (del.delivered_at || !del.due_date) continue;
      const d = daysBetween(today, del.due_date);
      if (d >= 0 && d <= 7) {
        items.push({
          kind: "deliver_soon",
          title: `Deliverable due in ${d} day${d === 1 ? "" : "s"}`,
          detail: `${del.description} · ${deal.campaign_name}`,
          href: `/deals/${deal.id}`,
          urgency: d,
        });
      }
    }
  }

  // Deals delivered but not invoiced
  for (const deal of db.deals) {
    if (deal.status === "Delivered") {
      items.push({
        kind: "not_invoiced",
        title: "Delivered but not invoiced",
        detail: `${deal.campaign_name} · ${brandName(db, deal.brand_id)}`,
        href: `/deals/${deal.id}`,
        amount: deal.total_value,
        currency: deal.currency,
        urgency: -1000, // this is the killer feature — surface it high
      });
    }
  }

  // Usage rights expiring within 30 days
  for (const deal of db.deals) {
    if (deal.usage_rights_months && deal.usage_rights_start) {
      const [y, m, d] = deal.usage_rights_start.slice(0, 10).split("-").map(Number);
      const expiry = new Date(Date.UTC(y, (m || 1) - 1 + deal.usage_rights_months, d || 1));
      const expiryISO = expiry.toISOString().slice(0, 10);
      const daysLeft = daysBetween(today, expiryISO);
      if (daysLeft >= 0 && daysLeft <= 30) {
        items.push({
          kind: "rights_expiring",
          title: `Usage rights expire in ${daysLeft} days`,
          detail: `${deal.campaign_name} · renegotiation opportunity`,
          href: `/deals/${deal.id}`,
          urgency: daysLeft,
        });
      }
    }
  }

  return items.sort((a, b) => a.urgency - b.urgency);
}

export interface ActivityItem {
  when: string;
  text: string;
  href: string;
}

export function recentActivity(db: Database, limit = 8): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const inv of db.invoices) {
    if (inv.paid_at)
      items.push({
        when: inv.paid_at,
        text: `Invoice ${inv.number} marked paid`,
        href: `/invoices/${inv.id}`,
      });
    if (inv.sent_at)
      items.push({
        when: inv.sent_at,
        text: `Invoice ${inv.number} sent to ${brandName(db, inv.brand_id)}`,
        href: `/invoices/${inv.id}`,
      });
  }
  for (const deal of db.deals) {
    items.push({
      when: deal.created_at,
      text: `Deal "${deal.campaign_name}" created`,
      href: `/deals/${deal.id}`,
    });
  }
  return items
    .sort((a, b) => (a.when < b.when ? 1 : -1))
    .slice(0, limit);
}

export function dealValue(deal: Deal): number {
  return deal.total_value || deal.deliverables.reduce((s, d) => s + d.amount, 0);
}

export function invoicesForDeal(db: Database, dealId: string): Invoice[] {
  return db.invoices.filter((i) => i.deal_id === dealId);
}
