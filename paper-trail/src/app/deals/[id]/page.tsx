"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useDatabase,
  setDealStatus,
  deleteDeal,
  saveDeliverable,
  deleteDeliverable,
  setDealPaymentSchedule,
  attachContract,
} from "@/lib/store";
import { DealForm } from "@/components/DealForm";
import { InvoiceStatusBadge, PageHeader } from "@/components/ui";
import { brandName, dealValue, invoicesForDeal } from "@/lib/derive";
import {
  derivedStatus,
  formatDate,
  invoiceTotal,
  money,
} from "@/lib/format";
import { DEAL_STATUSES, type DealStatus } from "@/lib/types";

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const db = useDatabase();
  const [editing, setEditing] = useState(false);

  const deal = db.deals.find((d) => d.id === id);
  if (!deal) {
    return (
      <div>
        <p className="text-muted">Deal not found.</p>
        <Link href="/deals" className="text-accent text-sm">← Back to deals</Link>
      </div>
    );
  }

  const invoices = invoicesForDeal(db, deal.id);
  const invoicedTotal = invoices.reduce((s, i) => s + invoiceTotal(i), 0);
  const usageExpiry =
    deal.usage_rights_months && deal.usage_rights_start
      ? (() => {
          const [y, m, d] = deal.usage_rights_start!.slice(0, 10).split("-").map(Number);
          const e = new Date(Date.UTC(y, (m || 1) - 1 + deal.usage_rights_months!, d || 1));
          return e.toISOString().slice(0, 10);
        })()
      : null;

  return (
    <div>
      <Link href="/deals" className="text-muted hover:text-ink mb-4 inline-block text-sm">← Deals</Link>

      {editing ? (
        <>
          <PageHeader title={`Edit ${deal.campaign_name}`} />
          <DealForm deal={deal} onCancel={() => setEditing(false)} />
        </>
      ) : (
        <>
          <PageHeader
            title={deal.campaign_name}
            sub={brandName(db, deal.brand_id)}
            action={
              <div className="flex gap-2">
                <Link href={`/invoices/new?from_deal=${deal.id}`} className="btn btn-primary">Create invoice</Link>
                <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit</button>
                <button
                  className="btn btn-ghost text-bad"
                  onClick={() => { if (confirm("Delete this deal and its deliverables?")) { deleteDeal(deal.id); router.push("/deals"); } }}
                >
                  Delete
                </button>
              </div>
            }
          />

          {/* Summary */}
          <div className="card mb-4 flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-muted text-xs uppercase tracking-wide">Value</p>
                <p className="tnum text-xl font-semibold">{money(dealValue(deal), deal.currency)}</p>
              </div>
              <div>
                <p className="text-muted text-xs uppercase tracking-wide">Invoiced</p>
                <p className="tnum text-xl font-semibold">{money(invoicedTotal, deal.currency)}</p>
              </div>
            </div>
            <label className="field">
              <span>Status</span>
              <select className="input w-44" value={deal.status} onChange={(e) => setDealStatus(deal.id, e.target.value as DealStatus)}>
                {DEAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <Deliverables dealId={deal.id} />

          {/* Contract + terms */}
          <ContractVault deal={deal} usageExpiry={usageExpiry} />

          {/* Linked invoices */}
          <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide">Invoices</h2>
          {invoices.length === 0 ? (
            <div className="card px-5 py-6 text-center">
              <p className="text-muted text-sm">No invoices yet for this deal.</p>
              <Link href={`/invoices/new?from_deal=${deal.id}`} className="btn btn-primary mt-3 inline-flex">Create invoice from deal</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <Link key={inv.id} href={`/invoices/${inv.id}`} className="card hover:border-accent flex items-center justify-between px-4 py-3 transition-colors">
                  <span className="text-sm"><span className="tnum text-muted">#{inv.number}</span> · {inv.memo || "Invoice"}</span>
                  <div className="flex items-center gap-3">
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

function Deliverables({ dealId }: { dealId: string }) {
  const db = useDatabase();
  const deal = db.deals.find((d) => d.id === dealId)!;
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ description: "", due_date: "", post_url: "", amount: "" });

  function add() {
    if (!draft.description.trim()) return;
    saveDeliverable(dealId, {
      description: draft.description,
      due_date: draft.due_date || null,
      post_url: draft.post_url || null,
      amount: parseFloat(draft.amount) || 0,
      delivered_at: null,
    });
    setDraft({ description: "", due_date: "", post_url: "", amount: "" });
    setAdding(false);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Deliverables</h2>
        <button className="text-accent text-sm" onClick={() => setAdding((a) => !a)}>+ Add deliverable</button>
      </div>

      {deal.deliverables.length === 0 && !adding ? (
        <p className="text-muted text-sm">No deliverables yet.</p>
      ) : (
        <div className="space-y-2">
          {deal.deliverables.map((del) => (
            <div key={del.id} className="card flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{del.description}</p>
                <p className="text-muted mt-0.5 text-xs">
                  {del.due_date ? `Due ${formatDate(del.due_date)}` : "No due date"}
                  {del.post_url ? " · " : ""}
                  {del.post_url ? <a href={del.post_url} target="_blank" rel="noreferrer" className="text-accent">post link</a> : null}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={() => saveDeliverable(dealId, { ...del, delivered_at: del.delivered_at ? null : new Date().toISOString().slice(0, 10) })}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${del.delivered_at ? "text-good border-transparent" : "border-line text-muted"}`}
                  style={del.delivered_at ? { backgroundColor: "rgba(63,143,95,0.12)" } : undefined}
                >
                  {del.delivered_at ? "Delivered ✓" : "Mark delivered"}
                </button>
                <span className="tnum text-sm">{money(del.amount, deal.currency)}</span>
                <button className="text-muted hover:text-bad" onClick={() => deleteDeliverable(dealId, del.id)}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="card mt-2 grid gap-2 px-4 py-3 sm:grid-cols-[1fr_150px_120px_auto]">
          <input className="input" placeholder="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <input type="date" className="input" value={draft.due_date} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} />
          <input className="input tnum" placeholder="Amount" inputMode="decimal" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
          <button className="btn btn-primary" onClick={add}>Add</button>
          <input className="input sm:col-span-4" placeholder="Post link (optional)" value={draft.post_url} onChange={(e) => setDraft({ ...draft, post_url: e.target.value })} />
        </div>
      ) : null}
    </div>
  );
}

function ContractVault({ deal, usageExpiry }: { deal: import("@/lib/types").Deal; usageExpiry: string | null }) {
  const [schedule, setSchedule] = useState(deal.payment_schedule);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => attachContract(deal.id, file.name, String(reader.result));
    reader.readAsDataURL(file);
  }

  function updateEntry(i: number, patch: Partial<{ date: string; amount: number }>) {
    const next = schedule.map((s, j) => (j === i ? { ...s, ...patch } : s));
    setSchedule(next);
    setDealPaymentSchedule(deal.id, next);
  }
  function addEntry() {
    const next = [...schedule, { date: "", amount: 0 }];
    setSchedule(next);
    setDealPaymentSchedule(deal.id, next);
  }
  function removeEntry(i: number) {
    const next = schedule.filter((_, j) => j !== i);
    setSchedule(next);
    setDealPaymentSchedule(deal.id, next);
  }

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">Contract &amp; terms</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card px-5 py-4">
          <p className="text-muted text-xs font-medium uppercase tracking-wide">Contract</p>
          {deal.contract_file_url ? (
            <a href={deal.contract_file_url} download={deal.contract_file_name ?? "contract.pdf"} className="text-accent mt-2 inline-block text-sm">
              {deal.contract_file_name ?? "Download contract"} ↓
            </a>
          ) : (
            <p className="text-muted mt-2 text-sm">No contract uploaded.</p>
          )}
          <label className="btn btn-ghost mt-3 inline-flex cursor-pointer">
            {deal.contract_file_url ? "Replace" : "Upload PDF"}
            <input type="file" accept="application/pdf" className="hidden" onChange={onFile} />
          </label>

          <div className="border-line mt-4 border-t pt-4">
            <p className="text-muted text-xs uppercase tracking-wide">Usage rights</p>
            {deal.usage_rights_months ? (
              <p className="mt-1 text-sm">
                {deal.usage_rights_months} months
                {deal.usage_rights_start ? ` from ${formatDate(deal.usage_rights_start)}` : ""}
                {usageExpiry ? <span className="text-muted"> · expires {formatDate(usageExpiry)}</span> : null}
              </p>
            ) : <p className="text-muted mt-1 text-sm">Not set — edit the deal to add.</p>}
            {deal.exclusivity_notes ? (
              <>
                <p className="text-muted mt-3 text-xs uppercase tracking-wide">Exclusivity</p>
                <p className="mt-1 text-sm">{deal.exclusivity_notes}</p>
              </>
            ) : null}
          </div>
        </div>

        <div className="card px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-muted text-xs font-medium uppercase tracking-wide">Payment schedule</p>
            <button className="text-accent text-sm" onClick={addEntry}>+ Add</button>
          </div>
          <p className="text-muted mt-1 text-xs">Invoices follow the contract, not the post date.</p>
          <div className="mt-3 space-y-2">
            {schedule.length === 0 ? (
              <p className="text-muted text-sm">No schedule set.</p>
            ) : (
              schedule.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_110px_auto] gap-2">
                  <input type="date" className="input" value={s.date} onChange={(e) => updateEntry(i, { date: e.target.value })} />
                  <input className="input tnum" inputMode="decimal" value={s.amount} onChange={(e) => updateEntry(i, { amount: parseFloat(e.target.value) || 0 })} />
                  <button className="text-muted hover:text-bad px-1" onClick={() => removeEntry(i)}>×</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
