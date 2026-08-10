"use client";

import Link from "next/link";
import type { DerivedInvoiceStatus, DealStatus } from "@/lib/types";

export function PageHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {sub ? <p className="text-muted mt-1 text-sm">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="font-medium">{title}</p>
      {hint ? <p className="text-muted max-w-sm text-sm">{hint}</p> : null}
      {action}
    </div>
  );
}

const INVOICE_TONE: Record<DerivedInvoiceStatus, string> = {
  Draft: "bg-ground text-muted border-line",
  Sent: "bg-accent-soft text-accent border-transparent",
  Paid: "text-good border-transparent",
  Overdue: "text-bad border-transparent",
};

export function InvoiceStatusBadge({ status }: { status: DerivedInvoiceStatus }) {
  const bg =
    status === "Paid"
      ? "rgba(63,143,95,0.12)"
      : status === "Overdue"
        ? "rgba(193,72,63,0.12)"
        : undefined;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${INVOICE_TONE[status]}`}
      style={bg ? { backgroundColor: bg } : undefined}
    >
      {status}
    </span>
  );
}

const DEAL_TONE: Record<DealStatus, string> = {
  Pitched: "#7a746a",
  Negotiating: "#c08a2d",
  Signed: "#3a7bd5",
  "In Progress": "#8a5cd5",
  Delivered: "#2d9c8a",
  Invoiced: "#c65d3b",
  Paid: "#3f8f5f",
  Dead: "#a89f92",
};

export function DealStatusDot({ status }: { status: DealStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: DEAL_TONE[status] }}
      />
      {status}
    </span>
  );
}

export function dealColor(status: DealStatus): string {
  return DEAL_TONE[status];
}

export function StatCard({
  label,
  value,
  tone,
  href,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "warn";
  href?: string;
}) {
  const color =
    tone === "good" ? "var(--good)" : tone === "bad" ? "var(--bad)" : tone === "warn" ? "var(--warn)" : "var(--ink)";
  const inner = (
    <div className="card px-5 py-4">
      <p className="text-muted text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="tnum mt-2 text-3xl font-semibold tracking-tight" style={{ color }}>
        {value}
      </p>
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-opacity hover:opacity-80">
      {inner}
    </Link>
  ) : (
    inner
  );
}
