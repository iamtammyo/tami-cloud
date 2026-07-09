"use client";

import { useState } from "react";
import { useDatabase, saveProfile, savePaymentMethod, deletePaymentMethod } from "@/lib/store";
import { profileSchema } from "@/lib/schemas";
import { PageHeader } from "@/components/ui";
import type { PaymentMethod, PaymentMethodType } from "@/lib/types";

export default function SettingsPage() {
  const db = useDatabase();
  const p = db.profile;

  const [form, setForm] = useState({
    business_name: p.business_name,
    display_name: p.display_name,
    email: p.email,
    address: p.address_lines.join("\n"),
    default_net_days: String(p.default_net_days),
    default_currency: p.default_currency,
    memo_convention: p.memo_convention,
    next_invoice_number: String(p.next_invoice_number),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  function upd(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  }

  function submit() {
    const parsed = profileSchema.safeParse({
      business_name: form.business_name,
      display_name: form.display_name,
      email: form.email,
      address_lines: form.address.split("\n").map((l) => l.trim()).filter(Boolean),
      default_net_days: form.default_net_days,
      default_currency: form.default_currency,
      memo_convention: form.memo_convention,
      next_invoice_number: form.next_invoice_number,
    });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (e[String(i.path[0])] = i.message));
      setErrors(e);
      return;
    }
    setErrors({});
    saveProfile(parsed.data);
    setSaved(true);
  }

  return (
    <div>
      <PageHeader title="Settings" sub="Set once, never re-type. These feed every invoice." />

      {/* Profile */}
      <section className="card mb-4 px-6 py-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" error={errors.business_name}>
            <input className="input" value={form.business_name} onChange={(e) => upd("business_name", e.target.value)} />
          </Field>
          <Field label="Display / influencer name" error={errors.display_name}>
            <input className="input" value={form.display_name} onChange={(e) => upd("display_name", e.target.value)} />
          </Field>
          <Field label="Email" error={errors.email}>
            <input className="input" value={form.email} onChange={(e) => upd("email", e.target.value)} />
          </Field>
          <Field label="Address (one line each)">
            <textarea className="input" rows={4} value={form.address} onChange={(e) => upd("address", e.target.value)} />
          </Field>
        </div>
      </section>

      {/* Invoice defaults */}
      <section className="card mb-4 px-6 py-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Invoice defaults</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Net terms (days)" error={errors.default_net_days}>
            <input className="input" inputMode="numeric" value={form.default_net_days} onChange={(e) => upd("default_net_days", e.target.value)} />
          </Field>
          <Field label="Currency" error={errors.default_currency}>
            <input className="input" value={form.default_currency} onChange={(e) => upd("default_currency", e.target.value)} />
          </Field>
          <Field label="Next invoice number" error={errors.next_invoice_number}>
            <input className="input" inputMode="numeric" value={form.next_invoice_number} onChange={(e) => upd("next_invoice_number", e.target.value)} />
          </Field>
          <Field label="Memo convention" error={errors.memo_convention}>
            <input className="input" value={form.memo_convention} onChange={(e) => upd("memo_convention", e.target.value)} />
          </Field>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button className="btn btn-primary" onClick={submit}>Save changes</button>
          {saved ? <span className="text-good text-sm">Saved ✓</span> : null}
        </div>
      </section>

      <PaymentMethods methods={db.payment_methods} />
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error ? <span className="text-bad mt-1 block text-xs">{error}</span> : null}
    </label>
  );
}

const PM_TYPES: PaymentMethodType[] = ["bank", "wise", "paypal", "payoneer", "other"];
const PM_TEMPLATES: Record<PaymentMethodType, string[]> = {
  bank: ["Account name", "Bank", "Account number", "SWIFT / Routing"],
  wise: ["Account holder", "Email", "Currency"],
  paypal: ["PayPal email"],
  payoneer: ["Payoneer email"],
  other: ["Detail"],
};

function PaymentMethods({ methods }: { methods: PaymentMethod[] }) {
  const [editing, setEditing] = useState<PaymentMethod | "new" | null>(null);

  return (
    <section className="card px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Payment methods</h2>
        <button className="btn btn-ghost" onClick={() => setEditing("new")}>+ Add</button>
      </div>

      {methods.length === 0 ? (
        <p className="text-muted text-sm">No payment methods yet.</p>
      ) : (
        <div className="space-y-2">
          {methods.map((m) => (
            <div key={m.id} className="border-line flex items-start justify-between gap-4 rounded-xl border px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{m.label}</span>
                  <span className="text-muted text-xs uppercase">{m.type}</span>
                  {m.is_default ? <span className="text-accent bg-accent-soft rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">Default</span> : null}
                </div>
                <p className="text-muted mt-1 truncate text-xs">
                  {Object.entries(m.details).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button className="text-muted hover:text-ink text-sm" onClick={() => setEditing(m)}>Edit</button>
                <button className="text-bad text-sm" onClick={() => deletePaymentMethod(m.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing ? (
        <PaymentMethodForm
          method={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </section>
  );
}

function PaymentMethodForm({ method, onClose }: { method: PaymentMethod | null; onClose: () => void }) {
  const [type, setType] = useState<PaymentMethodType>(method?.type ?? "bank");
  const [label, setLabel] = useState(method?.label ?? "");
  const [isDefault, setIsDefault] = useState(method?.is_default ?? false);
  const initialDetails = method?.details ?? Object.fromEntries(PM_TEMPLATES["bank"].map((k) => [k, ""]));
  const [details, setDetails] = useState<Record<string, string>>(initialDetails);

  function changeType(t: PaymentMethodType) {
    setType(t);
    if (!method) setDetails(Object.fromEntries(PM_TEMPLATES[t].map((k) => [k, ""])));
  }

  function save() {
    if (!label.trim()) return;
    savePaymentMethod({
      id: method?.id,
      type,
      label: label.trim(),
      details,
      is_default: isDefault,
    });
    onClose();
  }

  return (
    <div className="border-line bg-ground mt-4 rounded-xl border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field">
          <span>Type</span>
          <select className="input" value={type} onChange={(e) => changeType(e.target.value as PaymentMethodType)}>
            {PM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Label</span>
          <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Wise (USD)" />
        </label>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {Object.keys(details).map((k) => (
          <label key={k} className="field">
            <span>{k}</span>
            <input className="input" value={details[k]} onChange={(e) => setDetails((d) => ({ ...d, [k]: e.target.value }))} />
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          Default method
        </label>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
