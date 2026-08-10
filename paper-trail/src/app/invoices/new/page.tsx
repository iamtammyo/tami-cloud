"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { InvoiceForm } from "@/components/InvoiceForm";
import { PageHeader } from "@/components/ui";

function NewInvoiceInner() {
  const params = useSearchParams();
  const fromDeal = params.get("from_deal");
  return (
    <div>
      <Link href="/invoices" className="text-muted hover:text-ink mb-4 inline-block text-sm">← Invoices</Link>
      <PageHeader title="New invoice" sub={fromDeal ? "Pre-filled from the deal — edit anything before saving." : "Fill in the details below."} />
      <InvoiceForm fromDealId={fromDeal} />
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <NewInvoiceInner />
    </Suspense>
  );
}
