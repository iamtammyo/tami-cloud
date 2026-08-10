"use client";

import Link from "next/link";
import { useDatabase } from "@/lib/store";
import {
  dashboardNumbers,
  incomeByBrand,
  incomeByMonth,
  needsAttention,
  recentActivity,
} from "@/lib/derive";
import { moneyBig, money, formatDate } from "@/lib/format";
import { PageHeader, StatCard } from "@/components/ui";
import { IncomeByBrand, IncomeByMonthChart } from "@/components/IncomeChart";

const KIND_LABEL: Record<string, string> = {
  overdue: "Overdue",
  deliver_soon: "Due soon",
  not_invoiced: "Not invoiced",
  rights_expiring: "Rights",
};

export default function DashboardPage() {
  const db = useDatabase();
  const currency = db.profile.default_currency;
  const n = dashboardNumbers(db);
  const attention = needsAttention(db);
  const activity = recentActivity(db);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${db.profile.display_name.split(" ")[0] || "creator"}`}
        sub="The paper trail behind every brand deal."
        action={
          <Link href="/invoices/new" className="btn btn-primary">
            New invoice
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Outstanding" value={moneyBig(n.outstanding, currency)} href="/invoices?status=Sent" />
        <StatCard label="Overdue" value={moneyBig(n.overdue, currency)} tone={n.overdue > 0 ? "bad" : undefined} href="/invoices?status=Overdue" />
        <StatCard label="Paid this year" value={moneyBig(n.paidThisYear, currency)} tone="good" />
        <StatCard label="Paid this month" value={moneyBig(n.paidThisMonth, currency)} tone="good" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <IncomeByMonthChart data={incomeByMonth(db)} currency={currency} />
        <IncomeByBrand data={incomeByBrand(db)} currency={currency} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Needs attention */}
        <div className="card px-5 py-5">
          <p className="text-muted text-xs font-medium uppercase tracking-wide">
            Needs attention
          </p>
          <div className="mt-3 space-y-1">
            {attention.length === 0 ? (
              <p className="text-muted py-6 text-center text-sm">
                All clear — nothing needs chasing right now.
              </p>
            ) : (
              attention.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className="hover:bg-ground -mx-2 flex items-start justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                        style={{
                          background:
                            item.kind === "overdue" || item.kind === "not_invoiced"
                              ? "rgba(193,72,63,0.12)"
                              : "var(--accent-soft)",
                          color:
                            item.kind === "overdue" || item.kind === "not_invoiced"
                              ? "var(--bad)"
                              : "var(--accent)",
                        }}
                      >
                        {KIND_LABEL[item.kind]}
                      </span>
                      <span className="truncate text-sm font-medium">{item.title}</span>
                    </div>
                    <p className="text-muted mt-0.5 truncate text-xs">{item.detail}</p>
                  </div>
                  {item.amount ? (
                    <span className="tnum shrink-0 text-sm font-medium">
                      {money(item.amount, item.currency)}
                    </span>
                  ) : null}
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card px-5 py-5">
          <p className="text-muted text-xs font-medium uppercase tracking-wide">
            Recent activity
          </p>
          <div className="mt-3 space-y-1">
            {activity.length === 0 ? (
              <p className="text-muted py-6 text-center text-sm">No activity yet.</p>
            ) : (
              activity.map((a, i) => (
                <Link
                  key={i}
                  href={a.href}
                  className="hover:bg-ground -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors"
                >
                  <span className="truncate text-sm">{a.text}</span>
                  <span className="text-muted shrink-0 text-xs">{formatDate(a.when)}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
