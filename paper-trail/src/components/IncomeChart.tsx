"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { moneyBig } from "@/lib/format";

export function IncomeByMonthChart({
  data,
  currency,
}: {
  data: { month: string; total: number }[];
  currency: string;
}) {
  const hasData = data.some((d) => d.total > 0);
  return (
    <div className="card px-5 py-5">
      <p className="text-muted text-xs font-medium uppercase tracking-wide">
        Income by month
      </p>
      <div className="mt-4 h-48">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={54}
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                tickFormatter={(v) => (v ? `${Math.round(v / 1000)}k` : "0")}
              />
              <Tooltip
                cursor={{ fill: "var(--accent-soft)" }}
                formatter={(v: number) => [moneyBig(v, currency), "Income"]}
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill="var(--accent)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-muted flex h-full items-center justify-center text-sm">
            No paid invoices yet — mark one paid to see income here.
          </div>
        )}
      </div>
    </div>
  );
}

export function IncomeByBrand({
  data,
  currency,
}: {
  data: { name: string; total: number }[];
  currency: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div className="card px-5 py-5">
      <p className="text-muted text-xs font-medium uppercase tracking-wide">
        Income by brand
      </p>
      <div className="mt-4 space-y-3">
        {data.length === 0 ? (
          <p className="text-muted text-sm">No paid income yet.</p>
        ) : (
          data.map((d) => (
            <div key={d.name}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{d.name}</span>
                <span className="tnum text-muted">{moneyBig(d.total, currency)}</span>
              </div>
              <div className="bg-ground h-2 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${(d.total / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
