"use client";

import { useState } from "react";
import Link from "next/link";
import { useDatabase } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/ui";
import { BrandForm } from "@/components/BrandForm";
import { money } from "@/lib/format";

export default function BrandsPage() {
  const db = useDatabase();
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <PageHeader
        title="Brands"
        sub="Your client directory."
        action={<button className="btn btn-primary" onClick={() => setAdding(true)}>Add brand</button>}
      />

      {adding ? (
        <div className="mb-4">
          <BrandForm onDone={() => setAdding(false)} onCancel={() => setAdding(false)} />
        </div>
      ) : null}

      {db.brands.length === 0 && !adding ? (
        <EmptyState
          title="No brands yet"
          hint="Add your first brand partnership to start tracking deals and invoices."
          action={<button className="btn btn-primary" onClick={() => setAdding(true)}>Add your first brand</button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {db.brands.map((b) => {
            const deals = db.deals.filter((d) => d.brand_id === b.id).length;
            const invs = db.invoices.filter((i) => i.brand_id === b.id).length;
            return (
              <Link key={b.id} href={`/brands/${b.id}`} className="card hover:border-accent px-5 py-4 transition-colors">
                <p className="font-medium">{b.name}</p>
                {b.notes ? <p className="text-muted mt-1 line-clamp-2 text-sm">{b.notes}</p> : null}
                <div className="text-muted mt-3 flex gap-4 text-xs">
                  <span>{deals} deal{deals === 1 ? "" : "s"}</span>
                  <span>{invs} invoice{invs === 1 ? "" : "s"}</span>
                  {b.default_rate != null ? <span>Rate {money(b.default_rate)}</span> : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
