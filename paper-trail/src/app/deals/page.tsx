"use client";

import { useState } from "react";
import Link from "next/link";
import { useDatabase, setDealStatus } from "@/lib/store";
import { PageHeader, EmptyState, DealStatusDot, dealColor } from "@/components/ui";
import { DealForm } from "@/components/DealForm";
import { brandName, dealValue } from "@/lib/derive";
import { money } from "@/lib/format";
import { DEAL_STATUSES, type DealStatus } from "@/lib/types";

// Board omits terminal columns to stay focused; they still show in the table.
const BOARD_COLUMNS: DealStatus[] = [
  "Pitched",
  "Negotiating",
  "Signed",
  "In Progress",
  "Delivered",
  "Invoiced",
  "Paid",
];

export default function DealsPage() {
  const db = useDatabase();
  const [view, setView] = useState<"board" | "table">("board");
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <PageHeader
        title="Deals"
        sub="Your pipeline, from pitch to paid."
        action={
          <div className="flex gap-2">
            <div className="border-line flex overflow-hidden rounded-lg border">
              <button onClick={() => setView("board")} className={`px-3 py-1.5 text-sm ${view === "board" ? "bg-accent-soft text-accent" : "text-muted"}`}>Board</button>
              <button onClick={() => setView("table")} className={`px-3 py-1.5 text-sm ${view === "table" ? "bg-accent-soft text-accent" : "text-muted"}`}>Table</button>
            </div>
            <button className="btn btn-primary" onClick={() => setAdding(true)}>Add deal</button>
          </div>
        }
      />

      {adding ? (
        <div className="mb-4"><DealForm onCancel={() => setAdding(false)} /></div>
      ) : null}

      {db.deals.length === 0 && !adding ? (
        <EmptyState
          title="No deals yet"
          hint="Add your first brand partnership — every contract, deliverable and invoice hangs off a deal."
          action={<button className="btn btn-primary" onClick={() => setAdding(true)}>Add your first deal</button>}
        />
      ) : view === "board" ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {BOARD_COLUMNS.map((col) => {
            const deals = db.deals.filter((d) => d.status === col);
            return (
              <div key={col} className="w-64 shrink-0">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dealColor(col) }} />
                    {col}
                  </span>
                  <span className="text-muted text-xs">{deals.length}</span>
                </div>
                <div className="space-y-2">
                  {deals.map((d) => (
                    <Link key={d.id} href={`/deals/${d.id}`} className="card hover:border-accent block px-3 py-3 transition-colors">
                      <p className="text-sm font-medium leading-snug">{d.campaign_name}</p>
                      <p className="text-muted mt-1 text-xs">{brandName(db, d.brand_id)}</p>
                      <p className="tnum mt-2 text-sm">{money(dealValue(d), d.currency)}</p>
                    </Link>
                  ))}
                  {deals.length === 0 ? <div className="border-line text-muted rounded-xl border border-dashed px-3 py-4 text-center text-xs">—</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card divide-line divide-y">
          {db.deals.map((d) => (
            <div key={d.id} className="hover:bg-ground flex items-center justify-between gap-4 px-5 py-3 transition-colors">
              <Link href={`/deals/${d.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.campaign_name}</p>
                <p className="text-muted text-xs">{brandName(db, d.brand_id)}</p>
              </Link>
              <select
                value={d.status}
                onChange={(e) => setDealStatus(d.id, e.target.value as DealStatus)}
                className="border-line bg-surface rounded-lg border px-2 py-1 text-xs"
              >
                {DEAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="tnum w-24 text-right text-sm font-medium">{money(dealValue(d), d.currency)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
