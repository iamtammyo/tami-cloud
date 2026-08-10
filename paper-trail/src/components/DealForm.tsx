"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDatabase, saveDeal } from "@/lib/store";
import { dealSchema } from "@/lib/schemas";
import { DEAL_STATUSES, type Deal } from "@/lib/types";

export function DealForm({ deal, onCancel }: { deal?: Deal; onCancel: () => void }) {
  const db = useDatabase();
  const router = useRouter();

  const [brandId, setBrandId] = useState(deal?.brand_id ?? db.brands[0]?.id ?? "");
  const [campaign, setCampaign] = useState(deal?.campaign_name ?? "");
  const [status, setStatus] = useState<Deal["status"]>(deal?.status ?? "Pitched");
  const [total, setTotal] = useState(deal ? String(deal.total_value) : "");
  const [currency, setCurrency] = useState(deal?.currency ?? db.profile.default_currency);
  const [rightsMonths, setRightsMonths] = useState(deal?.usage_rights_months != null ? String(deal.usage_rights_months) : "");
  const [rightsStart, setRightsStart] = useState(deal?.usage_rights_start ?? "");
  const [exclusivity, setExclusivity] = useState(deal?.exclusivity_notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function save() {
    const parsed = dealSchema.safeParse({
      brand_id: brandId,
      campaign_name: campaign,
      status,
      total_value: total || 0,
      currency,
      usage_rights_months: rightsMonths === "" ? null : rightsMonths,
      usage_rights_start: rightsStart || null,
      exclusivity_notes: exclusivity,
    });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (e[i.path.join(".")] = i.message));
      setErrors(e);
      return;
    }
    const id = saveDeal({
      id: deal?.id,
      brand_id: parsed.data.brand_id,
      campaign_name: parsed.data.campaign_name,
      status: parsed.data.status as Deal["status"],
      total_value: parsed.data.total_value,
      currency: parsed.data.currency,
      usage_rights_months: parsed.data.usage_rights_months as number | null,
      usage_rights_start: parsed.data.usage_rights_start,
      exclusivity_notes: parsed.data.exclusivity_notes,
    });
    router.push(`/deals/${id}`);
  }

  return (
    <div className="card px-6 py-5">
      {db.brands.length === 0 ? (
        <p className="text-muted text-sm">Add a brand first before creating a deal.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              <span>Brand</span>
              <select className="input" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                {db.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {errors.brand_id ? <span className="text-bad text-xs">{errors.brand_id}</span> : null}
            </label>
            <label className="field">
              <span>Campaign name</span>
              <input className="input" value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="e.g. Slate May–June 2026" />
              {errors.campaign_name ? <span className="text-bad text-xs">{errors.campaign_name}</span> : null}
            </label>
            <label className="field">
              <span>Status</span>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Deal["status"])}>
                {DEAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Total value</span>
              <input className="input tnum" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} />
            </label>
            <label className="field">
              <span>Usage rights (months)</span>
              <input className="input" inputMode="numeric" value={rightsMonths} onChange={(e) => setRightsMonths(e.target.value)} placeholder="e.g. 12" />
            </label>
            <label className="field">
              <span>Usage rights start</span>
              <input type="date" className="input" value={rightsStart} onChange={(e) => setRightsStart(e.target.value)} />
            </label>
            <label className="field sm:col-span-2">
              <span>Exclusivity notes</span>
              <textarea className="input" rows={2} value={exclusivity} onChange={(e) => setExclusivity(e.target.value)} />
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>{deal ? "Save deal" : "Create deal"}</button>
          </div>
        </>
      )}
    </div>
  );
}
