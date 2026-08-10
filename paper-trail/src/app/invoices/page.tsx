"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDatabase } from "@/lib/store";
import { PageHeader, EmptyState, InvoiceStatusBadge } from "@/components/ui";
import { brandName } from "@/lib/derive";
import { derivedStatus, formatDate, invoiceTotal, money } from "@/lib/format";
import type { DerivedInvoiceStatus } from "@/lib/types";

const FILTERS: (DerivedInvoiceStatus | "All")[] = ["All", "Draft", "Sent", "Overdue", "Paid"];

function InvoicesInner() {
  const db = useDatabase();
  const params = useSearchParams();
  const [filter, setFilter] = useState<DerivedInvoiceStatus | "All">(
    (params.get("status") as DerivedInvoiceStatus) || "All"
  );

  const rows = db.invoices
    .map((inv) => ({ inv, status: derivedStatus(inv) }))
    .filter((r) => filter === "All" || r.status === filter)
    .sort((a, b) => (a.inv.date < b.inv.date ? 1 : -1));

  return (
    <div>
      <PageHeader
        title="Invoices"
        sub={`Next number: ${String(db.profile.next_invoice_number).padStart(4, "0")}`}
        action={<Link href="/invoices/new" className="btn btn-primary">New invoice</Link>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              filter === f ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:text-ink"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {db.invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          hint="Create your first invoice — it'll auto-fill from your profile and brand."
          action={<Link href="/invoices/new" className="btn btn-primary">Create invoice</Link>}
        />
      ) : rows.length === 0 ? (
        <p className="text-muted text-sm">No {filter.toLowerCase()} invoices.</p>
      ) : (
        <div className="card divide-line divide-y">
          {rows.map(({ inv, status }) => (
            <Link key={inv.id} href={`/invoices/${inv.id}`} className="hover:bg-ground flex items-center justify-between gap-4 px-5 py-3.5 transition-colors">
              <div className="flex min-w-0 items-center gap-4">
                <span className="tnum text-muted w-12 shrink-0 text-sm">#{inv.number}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{inv.memo || inv.campaign || "Invoice"}</p>
                  <p className="text-muted truncate text-xs">{brandName(db, inv.brand_id)} · {formatDate(inv.date)}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <InvoiceStatusBadge status={status} />
                <span className="tnum w-24 text-right text-sm font-medium">{money(invoiceTotal(inv), inv.currency)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <InvoicesInner />
    </Suspense>
  );
}
