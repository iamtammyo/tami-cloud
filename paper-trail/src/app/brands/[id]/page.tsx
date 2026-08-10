"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useDatabase, deleteBrand } from "@/lib/store";
import { BrandForm } from "@/components/BrandForm";
import { InvoiceStatusBadge, DealStatusDot, PageHeader } from "@/components/ui";
import { money, formatDate, invoiceTotal, derivedStatus } from "@/lib/format";
import { dealValue } from "@/lib/derive";

export default function BrandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const db = useDatabase();
  const [editing, setEditing] = useState(false);

  const brand = db.brands.find((b) => b.id === id);
  if (!brand) {
    return (
      <div>
        <p className="text-muted">Brand not found.</p>
        <Link href="/brands" className="text-accent text-sm">← Back to brands</Link>
      </div>
    );
  }

  const deals = db.deals.filter((d) => d.brand_id === brand.id);
  const invoices = db.invoices.filter((i) => i.brand_id === brand.id);

  return (
    <div>
      <Link href="/brands" className="text-muted hover:text-ink mb-4 inline-block text-sm">← Brands</Link>

      {editing ? (
        <BrandForm brand={brand} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
      ) : (
        <>
          <PageHeader
            title={brand.name}
            sub={brand.bill_to_name !== brand.name ? `Bill to: ${brand.bill_to_name}` : undefined}
            action={
              <div className="flex gap-2">
                <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit</button>
                <button
                  className="btn btn-ghost text-bad"
                  onClick={() => {
                    if (confirm(`Delete ${brand.name}? Deals and invoices remain but lose this link.`)) {
                      deleteBrand(brand.id);
                      router.push("/brands");
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            }
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card px-5 py-4">
              <p className="text-muted text-xs font-medium uppercase tracking-wide">Billing</p>
              {brand.address_lines.length ? (
                <div className="mt-2 text-sm">
                  {brand.address_lines.map((l, i) => <p key={i}>{l}</p>)}
                </div>
              ) : <p className="text-muted mt-2 text-sm">No address on file.</p>}
              {brand.default_rate != null ? (
                <p className="text-muted mt-3 text-sm">Default rate: <span className="text-ink">{money(brand.default_rate)}</span></p>
              ) : null}
              {brand.notes ? <p className="mt-3 text-sm">{brand.notes}</p> : null}
            </div>

            <div className="card px-5 py-4">
              <p className="text-muted text-xs font-medium uppercase tracking-wide">Contacts</p>
              {brand.contacts.length ? (
                <div className="mt-2 space-y-2">
                  {brand.contacts.map((c) => (
                    <div key={c.id} className="text-sm">
                      <span className="font-medium">{c.name}</span>
                      {c.role ? <span className="text-muted"> · {c.role}</span> : null}
                      {c.email ? <div className="text-muted text-xs">{c.email}</div> : null}
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted mt-2 text-sm">No contacts yet.</p>}
            </div>
          </div>

          {/* History */}
          <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide">Deals</h2>
          {deals.length === 0 ? (
            <p className="text-muted text-sm">No deals with this brand yet.</p>
          ) : (
            <div className="space-y-2">
              {deals.map((d) => (
                <Link key={d.id} href={`/deals/${d.id}`} className="card hover:border-accent flex items-center justify-between px-4 py-3 transition-colors">
                  <div>
                    <p className="font-medium">{d.campaign_name}</p>
                    <div className="mt-1"><DealStatusDot status={d.status} /></div>
                  </div>
                  <span className="tnum text-sm">{money(dealValue(d), d.currency)}</span>
                </Link>
              ))}
            </div>
          )}

          <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide">Invoices</h2>
          {invoices.length === 0 ? (
            <p className="text-muted text-sm">No invoices for this brand yet.</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <Link key={inv.id} href={`/invoices/${inv.id}`} className="card hover:border-accent flex items-center justify-between px-4 py-3 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="tnum text-muted text-sm">#{inv.number}</span>
                    <span className="text-sm">{inv.memo || inv.campaign || "Invoice"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted text-xs">{formatDate(inv.date)}</span>
                    <InvoiceStatusBadge status={derivedStatus(inv)} />
                    <span className="tnum text-sm font-medium">{money(invoiceTotal(inv), inv.currency)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
