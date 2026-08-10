"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { InvoicePdf } from "@/lib/invoice-pdf";
import type { Brand, Invoice, PaymentMethod, Profile } from "@/lib/types";

// Generate the PDF fully in-browser on click — no server round-trip.
export function DownloadInvoiceButton({
  invoice,
  profile,
  brand,
  paymentMethod,
  className = "btn btn-primary",
  label = "Download PDF",
}: {
  invoice: Invoice;
  profile: Profile;
  brand: Brand | undefined;
  paymentMethod: PaymentMethod | undefined;
  className?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const blob = await pdf(
        <InvoicePdf
          invoice={invoice}
          profile={profile}
          brand={brand}
          paymentMethod={paymentMethod}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${invoice.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className={className} onClick={download} disabled={busy}>
      {busy ? "Generating…" : label}
    </button>
  );
}
