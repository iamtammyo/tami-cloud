"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { mediaKitChannels, mediaKitRates, site } from "@/content/desktop";
import type { Folder } from "@/content/types";
import type { StatsPayload } from "@/app/api/stats/route";
import { FileGlyph } from "./FolderIcon";

const SERVICE_LABEL: Record<string, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  tiktok: "TikTok",
  substack: "Substack",
  threads: "Threads",
};

function fmt(n: number, unit: string) {
  if (unit === "percentage") return `${n.toFixed(1)}%`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  return Math.round(n).toLocaleString("en-GB");
}

export default function MediaKit({ folder }: { folder: Folder }) {
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j: StatsPayload) => setStats(j))
      .catch(() => setFailed(true));
  }, []);

  const headline = stats?.totals.filter((m) => ["reach", "reactions", "comments", "shares", "postCount"].includes(m.type)) ?? [];

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <p className="t-label text-[var(--desk-muted)]">Last {stats?.windowDays ?? 30} days, all channels</p>
          <p className="text-[11px] text-[var(--desk-muted)]">
            {failed
              ? "Couldn't load numbers"
              : !stats
                ? "Loading from Buffer…"
                : stats.sample
                  ? `Snapshot · ${new Date(stats.updatedAt ?? "").toLocaleDateString("en-GB")}`
                  : `Live from Buffer · updated ${new Date(stats.updatedAt ?? "").toLocaleDateString("en-GB")}`}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--desk-line-strong)] bg-[var(--desk-line)] sm:grid-cols-5">
          {(headline.length ? headline : new Array(5).fill(null)).map((m, i) => (
            <div key={m?.type ?? i} className="bg-[var(--desk-paper)] px-4 py-4">
              <dt className="t-label text-[var(--desk-muted)]">{m?.name ?? "—"}</dt>
              <dd className="t-serif mt-1 text-[32px] tabular-nums">{m ? fmt(m.value, m.unit) : "·"}</dd>
            </div>
          ))}
        </dl>
        <p className="t-body mt-3 text-[13px]">
          Numbers come from Buffer&rsquo;s API, cached hourly. Yes, I work there. I&rsquo;d use it anyway.
        </p>
      </section>

      <section>
        <p className="t-label mb-3 text-[var(--desk-muted)]">Channels</p>
        <ul className="divide-y divide-[var(--desk-line)] border-y border-[var(--desk-line)]">
          {mediaKitChannels.map((c) => {
            const ch = stats?.channels.find((x) => x.bufferChannelId === c.bufferChannelId);
            const reach = ch?.metrics.find((m) => m.type === "reach");
            const eng = ch?.metrics.find((m) => m.type === "engagementRate");
            return (
              <li key={c.bufferChannelId} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                <div className="min-w-[180px] flex-1">
                  <a href={c.url} target="_blank" rel="noreferrer" className="t-serif text-[20px] ink-link">
                    {c.handle}
                  </a>
                  <p className="t-label text-[var(--desk-muted)]">{SERVICE_LABEL[c.service]}</p>
                </div>
                <div className="flex gap-6 text-[12px] tabular-nums">
                  {c.followers && (
                    <span>
                      <span className="t-label block text-[var(--desk-muted)]">Followers</span>
                      {c.followers}
                    </span>
                  )}
                  <span>
                    <span className="t-label block text-[var(--desk-muted)]">Reach</span>
                    {reach ? fmt(reach.value, reach.unit) : "—"}
                  </span>
                  <span>
                    <span className="t-label block text-[var(--desk-muted)]">Eng. rate</span>
                    {eng ? fmt(eng.value, eng.unit) : "—"}
                  </span>
                </div>
                {c.audienceNote && <p className="t-body w-full text-[13px]">{c.audienceNote}</p>}
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <p className="t-label mb-3 text-[var(--desk-muted)]">Rates</p>
        <table className="w-full border-collapse text-[14px]">
          <tbody>
            {mediaKitRates.map((r) => (
              <tr key={r.deliverable} className="border-t border-[var(--desk-line)] align-top">
                <td className="py-3 pr-4">
                  <span className="font-medium">{r.deliverable}</span>
                  {r.note && <p className="t-body mt-0.5 text-[12.5px]">{r.note}</p>}
                </td>
                <td className="t-serif whitespace-nowrap py-3 text-right text-[20px]">{r.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <a
          href={`mailto:${site.email}?subject=Brand%20work`}
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-[var(--desk-ink)] px-4 py-2.5 text-[13px] font-medium text-[var(--desk-cream)] hover:bg-[var(--desk-ink-2)]"
        >
          Request the full kit ↗
        </a>
      </section>

      <section>
        <p className="t-label mb-3 text-[var(--desk-muted)]">How it works, and past deals</p>
        <ul className="border-t border-[var(--desk-line)]">
          {folder.files.map((f) => (
            <li key={f.slug}>
              <Link href={`/${folder.slug}/${f.slug}`} className="row flex items-start gap-3 px-2 py-3.5">
                <FileGlyph kind={f.kind} />
                <div className="min-w-0 flex-1">
                  <p className="t-serif text-[21px] leading-tight">{f.title}</p>
                  {f.summary && <p className="t-body mt-0.5 text-[13.5px]">{f.summary}</p>}
                </div>
                {f.publisher && <p className="t-label hidden text-[var(--desk-muted)] sm:block">{f.publisher}</p>}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
