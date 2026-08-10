"use client";

import { useState } from "react";
import { saveBrand } from "@/lib/store";
import { brandSchema } from "@/lib/schemas";
import type { Brand } from "@/lib/types";

export function BrandForm({
  brand,
  onDone,
  onCancel,
}: {
  brand?: Brand;
  onDone: (id: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(brand?.name ?? "");
  const [billTo, setBillTo] = useState(brand?.bill_to_name ?? "");
  const [address, setAddress] = useState((brand?.address_lines ?? []).join("\n"));
  const [notes, setNotes] = useState(brand?.notes ?? "");
  const [rate, setRate] = useState(brand?.default_rate != null ? String(brand.default_rate) : "");
  const [contacts, setContacts] = useState(
    brand?.contacts?.length
      ? brand.contacts.map((c) => ({ ...c }))
      : [{ id: undefined as string | undefined, name: "", email: "", role: "" }]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function save() {
    const payload = {
      name,
      bill_to_name: billTo || name,
      address_lines: address.split("\n").map((l) => l.trim()).filter(Boolean),
      notes,
      default_rate: rate === "" ? null : rate,
      contacts: contacts
        .filter((c) => c.name.trim())
        .map((c) => ({ name: c.name, email: c.email, role: c.role })),
    };
    const parsed = brandSchema.safeParse(payload);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (e[i.path.join(".")] = i.message));
      setErrors(e);
      return;
    }
    const id = saveBrand({
      id: brand?.id,
      ...parsed.data,
      default_rate: parsed.data.default_rate as number | null,
      contacts: parsed.data.contacts.map((c, i) => ({ ...c, id: brand?.contacts[i]?.id })),
    });
    onDone(id);
  }

  return (
    <div className="border-line bg-surface rounded-xl border p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">
          <span>Brand name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name ? <span className="text-bad text-xs">{errors.name}</span> : null}
        </label>
        <label className="field">
          <span>Legal / bill-to name</span>
          <input className="input" value={billTo} onChange={(e) => setBillTo(e.target.value)} placeholder="Defaults to brand name" />
        </label>
        <label className="field">
          <span>Billing address (one line each)</span>
          <textarea className="input" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
        </label>
        <label className="field">
          <span>Default rate (optional)</span>
          <input className="input" inputMode="numeric" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="e.g. 1000" />
        </label>
        <label className="field sm:col-span-2">
          <span>Notes</span>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. invoices go to Krizia, contract signer is Vin" />
        </label>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-muted text-xs font-medium uppercase tracking-wide">Contacts</span>
          <button
            className="text-accent text-sm"
            onClick={() => setContacts((c) => [...c, { id: undefined, name: "", email: "", role: "" }])}
          >
            + Add contact
          </button>
        </div>
        <div className="space-y-2">
          {contacts.map((c, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <input className="input" placeholder="Name" value={c.name} onChange={(e) => setContacts((cs) => cs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <input className="input" placeholder="Email" value={c.email} onChange={(e) => setContacts((cs) => cs.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))} />
              <input className="input" placeholder="Role (e.g. Invoices)" value={c.role} onChange={(e) => setContacts((cs) => cs.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))} />
              <button className="text-muted hover:text-bad px-2" onClick={() => setContacts((cs) => cs.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
        </div>
        {errors["contacts.0.email"] ? <span className="text-bad text-xs">Check contact emails</span> : null}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={save}>{brand ? "Save changes" : "Add brand"}</button>
      </div>
    </div>
  );
}
