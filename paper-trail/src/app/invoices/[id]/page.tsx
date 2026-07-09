"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useDatabase,
  setInvoiceStatus,
  deleteInvoice,
  duplicateInvoice,
} from "@/lib/store";
import { InvoiceForm } from "@/components/InvoiceForm";
import { DownloadInvoiceButton } from "@/components/DownloadInvoiceButton";
import { InvoiceStatusBadge, PageHeader } from "@/components/ui";
import { brandName } from "@/lib/derive";
import {
  derivedStatus,
  formatDate,
  invoiceDueDate,
  invoiceTotal,
  itemsSorted,
  money,
  todayISO,
} from "@/lib/format";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const db = useDatabase();
  const [editing, setEditing] = useState(false);

  const invoice = db.invoices.find((i) => i.id === id);
  if (!invoice) {
    return (
      <div>
        <p className="text-muted">Invoice not found.</p>
        <Link href="/invoices" className="text-accent text-sm">← Back to invoices</Link>
      </div>
    );
  }

  const brand = db.brands.find((b) => b.id === invoice.brand_id);
  const pm = db.payment_methods.find((m) => m.id === invoice.payment_method_id);
  const status = derivedStatus(invoice);
  const total = invoiceTotal(invoice);

  if (editing) {
    return (
      <div>
        <Link href={`/invoices/${invoice.id}`} onClick={() => setEditing(false)} className="text-muted hover:text-ink mb-4 inline-block text-sm">← Cancel edit</Link>
        <PageHeader title={`Edit invoice ${invoice.number}`} />
        <InvoiceForm invoice={invoice} />
      </div>
    );
  }

  return (
    <div>
      <Link href="/invoices" className="text-muted hover:text-ink mb-4 inline-block text-sm">← Invoices</Link>

      <PageHeader
        title={`Invoice ${invoice.number}`}
        sub={`${brandName(db, invoice.brand_id)} · ${formatDate(invoice.date)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <DownloadInvoiceButton invoice={invoice} profile={db.profile} brand={brand} paymentMethod={pm} />
            <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit</button>
          </div>
        }
      />

      {/* Status + actions bar */}
      <div className="card mb-4 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <InvoiceStatusBadge status={status} />
          {invoice.sent_at ? <span className="text-muted text-xs">Sent {formatDate(invoice.sent_at)}</span> : null}
          {invoice.paid_at ? <span className="text-good text-xs">Paid {formatDate(invoice.paid_at)}</span> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.status !== "Sent" && invoice.status !== "Paid" ? (
            <button className="btn btn-ghost" onClick={() => setInvoiceStatus(invoice.id, "Sent", { sent_at: todayISO() })}>Mark sent</button>
          ) : null}
          {invoice.status !== "Paid" ? (
            <button className="btn btn-ghost" onClick={() => setInvoiceStatus(invoice.id, "Paid", { paid_at: todayISO(), sent_at: invoice.sent_at ?? todayISO() })}>Mark paid</button>
          ) : (
            <button className="btn btn-ghost" onClick={() => setInvoiceStatus(invoice.id, "Sent", { paid_at: null })}>Reopen</button>
          )}
          <button className="btn btn-ghost" onClick={() => { const nid = duplicateInvoice(invoice.id); if (nid) router.push(`/invoices/${nid}`); }}>Duplicate</button>
          <button className="btn btn-ghost text-bad" onClick={() => { if (confirm(`Delete invoice ${invoice.number}?`)) { deleteInvoice(invoice.id); router.push("/invoices"); } }}>Delete</button>
        </div>
      </div>

      {/* Preview */}
      <div className="card px-6 py-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted text-xs uppercase tracking-wide">Bill to</p>
            <p className="mt-1 font-medium">{brand?.bill_to_name || brand?.name}</p>
            {brand?.address_lines.map((l, i) => <p key={i} className="text-muted text-sm">{l}</p>)}
          </div>
          <div className="text-right">
            <p className="text-muted text-xs uppercase tracking-wide">From</p>
            <p className="mt-1 font-medium">{db.profile.business_name}</p>
            {db.profile.address_lines.map((l, i) => <p key={i} className="text-muted text-sm">{l}</p>)}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-muted text-xs uppercase tracking-wide">Total ({invoice.currency})</p>
          <p className="tnum text-4xl font-semibold tracking-tight">{money(total, invoice.currency)}</p>
          <p className="text-muted mt-1 text-sm">Net {invoice.net_days} · Due {formatDate(invoiceDueDate(invoice))}</p>
        </div>

        <div className="mt-6">
          <div className="bg-accent h-0.5 w-full" />
          {itemsSorted(invoice.items).map((it) => (
            <div key={it.id} className="border-line flex items-start justify-between gap-4 border-b py-3">
              <div className="min-w-0">
                <p className="font-medium">{it.description}</p>
                {it.detail ? <p className="text-muted text-sm">{it.detail}</p> : null}
                {it.link ? <a href={it.link} target="_blank" rel="noreferrer" className="text-accent text-sm">{it.link}</a> : null}
              </div>
              <span className="tnum shrink-0 text-sm">{money(it.amount, invoice.currency)}</span>
            </div>
          ))}
          <div className="flex justify-between py-3">
            <span className="font-medium">Total ({invoice.currency})</span>
            <span className="tnum font-semibold">{money(total, invoice.currency)}</span>
          </div>
        </div>

        {pm ? (
          <div className="bg-ground mt-4 rounded-xl px-4 py-3">
            <p className="text-muted text-xs uppercase tracking-wide">Payment details · {pm.label}</p>
            <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
              {Object.entries(pm.details).map(([k, v]) => (
                <p key={k}><span className="text-muted">{k}:</span> {v}</p>
              ))}
            </div>
          </div>
        ) : null}

        {invoice.deal_id ? (
          <Link href={`/deals/${invoice.deal_id}`} className="text-accent mt-4 inline-block text-sm">View linked deal →</Link>
        ) : null}
      </div>
    </div>
  );
}
