"use client";

import { useEffect, useMemo, useState } from "react";
import { PHOTOGRAPHERS } from "../lib/photographers";
import { loadPhotos } from "../lib/storage";
import type { GenreTag, StoredPhoto } from "../lib/types";

export default function Stats() {
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);

  useEffect(() => {
    setPhotos(loadPhotos());
  }, []);

  const counts = useMemo(() => buildCounts(photos), [photos]);

  if (photos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-700 px-8 py-16 text-center">
        <p className="text-stone-300">No data yet.</p>
        <p className="mt-1 text-sm text-stone-500">
          Upload a few photos in <span className="text-stone-300">My Photos</span> and
          this tab will surface what you gravitate toward.
        </p>
      </div>
    );
  }

  const matchedPhotographers = matchPhotographers(counts.genres);
  const sampleCount = photos.length;
  const isThin = sampleCount < 5;

  return (
    <div className="space-y-10">
      <div className="rounded-lg border border-stone-800 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-medium">Your fingerprint so far</h2>
          <span className="text-xs text-stone-500">
            Based on {sampleCount} photo{sampleCount === 1 ? "" : "s"}
          </span>
        </div>
        {isThin && (
          <p className="mt-2 text-xs text-amber-300/80">
            Patterns get more meaningful past ~10 uploads. Treat this as a sketch.
          </p>
        )}
      </div>

      <Section title="Genres you reach for">
        <BarList items={counts.genres} total={sampleCount} />
      </Section>

      <Section title="Moods that recur">
        <BarList items={counts.moods} total={sampleCount} />
      </Section>

      <Section title="Subjects you're drawn to">
        {counts.subjects.length === 0 ? (
          <p className="text-sm text-stone-500">No common subjects yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {counts.subjects.map(([word, n]) => (
              <span
                key={word}
                className="rounded-full border border-stone-700 px-3 py-1 text-sm"
                title={`${n} photo${n === 1 ? "" : "s"}`}
              >
                {word}{" "}
                <span className="text-stone-500">×{n}</span>
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Color palette tendencies">
        {counts.colors.length === 0 ? (
          <p className="text-sm text-stone-500">No palette signal yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {counts.colors.map(([word, n]) => (
              <span
                key={word}
                className="rounded-md border border-stone-700 px-3 py-1 text-sm"
              >
                {word} <span className="text-stone-500">×{n}</span>
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Recurring growth themes">
        {counts.improvements.length === 0 ? (
          <p className="text-sm text-stone-500">
            No repeated suggestions yet — upload a few more photos.
          </p>
        ) : (
          <ul className="space-y-2 text-sm text-stone-200">
            {counts.improvements.map(([line, n]) => (
              <li key={line} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-stone-500" />
                <span>
                  {line}{" "}
                  <span className="text-xs text-stone-500">
                    (came up in {n} photo{n === 1 ? "" : "s"})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Photographers worth studying">
        {matchedPhotographers.length === 0 ? (
          <p className="text-sm text-stone-500">
            Once your genre profile fills in, we'll surface relevant photographers.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {matchedPhotographers.map((m) => (
              <div
                key={m.photographer.id}
                className="rounded-md border border-stone-800 p-4"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="font-medium">{m.photographer.name}</h4>
                  <span className="text-xs text-stone-500">
                    {m.photographer.styles.join(", ")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-stone-300">
                  {m.photographer.signature}
                </p>
                <p className="mt-2 text-xs text-stone-500">
                  Why: overlaps with your {m.matchedStyles.join(", ")} work.
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-stone-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function BarList({ items, total }: { items: [string, number][]; total: number }) {
  if (items.length === 0)
    return <p className="text-sm text-stone-500">Not enough data yet.</p>;
  const max = items[0][1];
  return (
    <div className="space-y-2">
      {items.map(([label, n]) => {
        const pct = Math.round((n / max) * 100);
        const share = Math.round((n / total) * 100);
        return (
          <div key={label} className="flex items-center gap-3">
            <div className="w-32 text-sm">{label}</div>
            <div className="relative h-2 flex-1 rounded bg-stone-900">
              <div
                className="absolute left-0 top-0 h-full rounded bg-stone-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="w-16 text-right text-xs text-stone-400">
              {n} · {share}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

type Counts = {
  genres: [string, number][];
  moods: [string, number][];
  subjects: [string, number][];
  colors: [string, number][];
  improvements: [string, number][];
};

function buildCounts(photos: StoredPhoto[]): Counts {
  const genre = new Map<string, number>();
  const mood = new Map<string, number>();
  const subject = new Map<string, number>();
  const color = new Map<string, number>();
  const improvement = new Map<string, number>();

  for (const p of photos) {
    bump(genre, p.analysis.genre);
    bump(mood, p.analysis.mood);
    for (const s of p.analysis.subjects) bump(subject, s.toLowerCase());
    for (const c of p.analysis.palette) bump(color, c.toLowerCase());
    for (const imp of p.analysis.improvements) bump(improvement, normalize(imp));
  }

  return {
    genres: sortMap(genre),
    moods: sortMap(mood),
    subjects: sortMap(subject).filter(([, n]) => n >= 2).slice(0, 12),
    colors: sortMap(color).filter(([, n]) => n >= 2).slice(0, 10),
    improvements: sortMap(improvement).filter(([, n]) => n >= 2).slice(0, 6),
  };
}

function bump(map: Map<string, number>, key: string) {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + 1);
}

function sortMap(map: Map<string, number>): [string, number][] {
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

function normalize(s: string): string {
  return s.trim().replace(/\.$/, "");
}

function matchPhotographers(genres: [string, number][]) {
  const top = genres.slice(0, 3).map(([g]) => g as GenreTag);
  if (top.length === 0) return [];
  const matches = PHOTOGRAPHERS.map((p) => {
    const overlap = p.styles.filter((s) => top.includes(s));
    return { photographer: p, matchedStyles: overlap };
  })
    .filter((m) => m.matchedStyles.length > 0)
    .sort((a, b) => b.matchedStyles.length - a.matchedStyles.length)
    .slice(0, 6);
  return matches;
}
