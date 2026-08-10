"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDatabase, saveInvoice, nextInvoiceNumber } from "@/lib/store";
import { invoiceSchema } from "@/lib/schemas";
import type { Invoice } from "@/lib/types";
import { addDays, formatDate, money } from "@/lib/format";

interface ItemDraft {
  id?: string;
  description: string;
  detail: string;
  link: string;
  amount: string;
}

export function InvoiceForm({
  invoice,
  fromDealId,
}: {
  invoice?: Invoice;
  fromDealId?: string | null;
}) {
  const db = useDatabase();
  const router = useRouter();

  // Build the initial form: from an existing invoice, from a deal, or blank.
  const initial = useMemo(() => {
    if (invoice) {
      return {
        brand_id: invoice.brand_id,
        deal_id: invoice.deal_id,
        number: invoice.number,
        date: invoice.date,
        net_days: String(invoice.net_days),
        memo: invoice.memo,
        campaign: invoice.campaign,
        currency: invoice.currency,
        payment_method_id: invoice.payment_method_id,
        items: invoice.items
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((it) => ({
            id: it.id,
            description: it.description,
            detail: it.detail,
            link: it.link ?? "",
            amount: String(it.amount),
          })),
      };
    }
    const deal = fromDealId ? db.deals.find((d) => d.id === fromDealId) : undefined;
    const brand = deal ? db.brands.find((b) => b.id === deal.brand_id) : undefined;
    const defaultPm = db.payment_methods.find((m) => m.is_default) ?? db.payment_methods[0];
    const today = new Date().toISOString().slice(0, 10);
    // Memo from convention, e.g. "{Month of post} + {Brand}"
    const monthName = new Date().toLocaleDateString("en-US", { month: "long" });
    const memo = deal && brand ? `${monthName} ${brand.name}` : "";
    return {
      brand_id: deal?.brand_id ?? db.brands[0]?.id ?? "",
      deal_id: deal?.id ?? null,
      number: nextInvoiceNumber(),
      date: today,
      net_days: String(db.profile.default_net_days),
      memo,
      campaign: deal?.campaign_name ?? "",
      currency: deal?.currency ?? db.profile.default_currency,
      payment_method_id: defaultPm?.id ?? null,
      items: deal
        ? deal.deliverables.map((d) => ({
            description: d.description,
            detail: deal.campaign_name,
            link: d.post_url ?? "",
            amount: String(d.amount),
          }))
        : [{ description: "", detail: "", link: "", amount: "" }],
    };
  }, [invoice, fromDealId, db]);

  const [brandId, setBrandId] = useState(initial.brand_id);
  const [number, setNumber] = useState(initial.number);
  const [date, setDate] = useState(initial.date);
  const [netDays, setNetDays] = useState(initial.net_days);
  const [memo, setMemo] = useState(initial.memo);
  const [campaign, setCampaign] = useState(initial.campaign);
  const [currency, setCurrency] = useState(initial.currency);
  const [pmId, setPmId] = useState<string | null>(initial.payment_method_id);
  const [items, setItems] = useState<ItemDraft[]>(initial.items);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const total = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  const due = date ? addDays(date, parseInt(netDays) || 0) : "";

  function setItem(i: number, patch: Partial<ItemDraft>) {
    setItems((its) => its.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  function submit() {
    const payload = {
      brand_id: brandId,
      number,
      date,
      net_days: netDays,
      memo,
      campaign,
      currency,
      payment_method_id: pmId,
      items: items
        .filter((it) => it.description.trim() || it.amount)
        .map((it) => ({
          description: it.description,
          detail: it.detail,
          link: it.link,
          amount: it.amount,
        })),
    };
    const parsed = invoiceSchema.safeParse(payload);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((iss) => (e[iss.path.join(".")] = iss.message));
      setErrors(e);
      return;
    }
    const id = saveInvoice({
      id: invoice?.id,
      deal_id: invoice?.deal_id ?? initial.deal_id,
      brand_id: parsed.data.brand_id,
      number: parsed.data.number,
      date: parsed.data.date,
      net_days: parsed.data.net_days,
      memo: parsed.data.memo,
      campaign: parsed.data.campaign,
      currency: parsed.data.currency,
      status: invoice?.status ?? "Draft",
      payment_method_id: parsed.data.payment_method_id,
      sent_at: invoice?.sent_at ?? null,
      paid_at: invoice?.paid_at ?? null,
      items: parsed.data.items.map((it, idx) => ({
        id: items[idx]?.id,
        description: it.description,
        detail: it.detail,
        link: it.link,
        amount: it.amount,
        sort_order: idx,
      })),
    });
    router.push(`/invoices/${id}`);
  }

  return (
    <div className="space-y-4">
      <div className="card px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="field">
            <span>Brand</span>
            <select className="input" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              <option value="">Select brand…</option>
              {db.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {errors.brand_id ? <span className="text-bad text-xs">{errors.brand_id}</span> : null}
          </label>
          <label className="field">
            <span>Invoice number</span>
            <input className="input tnum" value={number} onChange={(e) => setNumber(e.target.value)} />
          </label>
          <label className="field">
            <span>Currency</span>
            <input className="input" value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </label>
          <label className="field">
            <span>Date</span>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field">
            <span>Net terms (days)</span>
            <input className="input" inputMode="numeric" value={netDays} onChange={(e) => setNetDays(e.target.value)} />
          </label>
          <label className="field">
            <span>Payment method</span>
            <select className="input" value={pmId ?? ""} onChange={(e) => setPmId(e.target.value || null)}>
              <option value="">None</option>
              {db.payment_methods.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </label>
          <label className="field sm:col-span-2">
            <span>Memo</span>
            <input className="input" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder={db.profile.memo_convention} />
          </label>
          <label className="field">
            <span>Campaign</span>
            <input className="input" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
          </label>
        </div>
        {due ? <p className="text-muted mt-3 text-sm">Due {formatDate(due)} · Net {netDays}</p> : null}
      </div>

      {/* Line items */}
      <div className="card px-6 py-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Line items</h2>
          <button className="text-accent text-sm" onClick={() => setItems((its) => [...its, { description: "", detail: "", link: "", amount: "" }])}>
            + Add line
          </button>
        </div>
        {errors.items ? <p className="text-bad mb-2 text-xs">{errors.items}</p> : null}
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="border-line grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_auto]">
              <div className="grid gap-2">
                <input className="input" placeholder="Description (e.g. LinkedIn video, crossposted to IG)" value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} />
                <input className="input" placeholder="Detail line (optional)" value={it.detail} onChange={(e) => setItem(i, { detail: e.target.value })} />
                <input className="input" placeholder="Post link (optional, clickable in PDF)" value={it.link} onChange={(e) => setItem(i, { link: e.target.value })} />
              </div>
              <div className="flex items-start gap-2">
                <label className="field w-32">
                  <span>Amount</span>
                  <input className="input tnum" inputMode="decimal" value={it.amount} onChange={(e) => setItem(i, { amount: e.target.value })} />
                </label>
                <button className="text-muted hover:text-bad mt-7 px-1" onClick={() => setItems((its) => its.filter((_, j) => j !== i))} title="Remove">×</button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-line mt-4 flex justify-end border-t pt-4">
          <div className="text-right">
            <p className="text-muted text-xs uppercase tracking-wide">Total ({currency})</p>
            <p className="tnum text-2xl font-semibold">{money(total, currency)}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
        <button className="btn btn-primary" onClick={submit}>{invoice ? "Save invoice" : "Create invoice"}</button>
      </div>
    </div>
  );
}
