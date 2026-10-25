"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PHOTOGRAPHERS } from "../lib/photographers";
import { loadCustomPhotographers, loadPhotos, loadProfile } from "../lib/storage";
import { buildPracticePrompts } from "../lib/practice";
import type { GenreTag, Photographer, StoredPhoto, UserProfile } from "../lib/types";

export default function Stats() {
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [customPhotographers, setCustomPhotographers] = useState<Photographer[]>([]);

  useEffect(() => {
    setPhotos(loadPhotos());
    setProfile(loadProfile());
    setCustomPhotographers(loadCustomPhotographers());

    function onProfileChange(e: Event) {
      setProfile((e as CustomEvent<UserProfile | null>).detail);
    }
    window.addEventListener("lensed:profile-changed", onProfileChange);
    return () => window.removeEventListener("lensed:profile-changed", onProfileChange);
  }, []);

  const counts = useMemo(() => buildCounts(photos), [photos]);
  const practice = useMemo(() => buildPracticePrompts(photos, profile), [photos, profile]);

  if (photos.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-[32px] text-fg">Nothing to read yet.</p>
        <p className="mt-2 text-[14px] text-fg2">
          Upload a few photos and this page fills in with what you gravitate toward.
        </p>
      </div>
    );
  }

  const matchedPhotographers = matchPhotographers(counts.genres, customPhotographers);
  const sampleCount = photos.length;
  const isThin = sampleCount < 5;

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label">Your fingerprint</div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-display text-[64px] leading-none text-fg">{sampleCount}</span>
            <span className="text-[15px] text-fg2">frame{sampleCount === 1 ? "" : "s"} read</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-fg2">
          <span className={`dot ${isThin ? "dot-accent" : "dot-ok"}`} />
          {isThin ? "Low sample — patterns firm up past ~10 frames" : "Ready"}
        </div>
      </div>

      {practice.length > 0 && (
        <section className="card p-6">
          <div className="flex items-center gap-2">
            <span className="dot dot-accent" />
            <span className="label">This week</span>
          </div>
          <h2 className="mt-2 font-display text-[26px] text-fg">
            Exercises based on your patterns
          </h2>
          <ul className="mt-5 divide-y divide-hair">
            {practice.map((p) => (
              <li key={p.id} className="py-4 first:pt-0 last:pb-0">
                <div className="text-[15px] font-medium text-fg">{p.title}</div>
                <p className="mt-1 text-[14px] leading-relaxed text-fg2">{p.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Section label="Genres you reach for">
        <BarList items={counts.genres} total={sampleCount} />
      </Section>

      <Section label="Moods that recur">
        <BarList items={counts.moods} total={sampleCount} />
      </Section>

      <Section label="Subjects you're drawn to">
        {counts.subjects.length === 0 ? (
          <Muted>No common subjects yet.</Muted>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {counts.subjects.map(([word, n]) => (
              <span key={word} className="chip" title={`${n} photo${n === 1 ? "" : "s"}`}>
                {word} <span className="font-mono text-[11px] opacity-60">{n}</span>
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section label="Palette tendencies">
        {counts.colors.length === 0 ? (
          <Muted>No palette signal yet.</Muted>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {counts.colors.map(([word, n]) => (
              <span key={word} className="chip">
                {word} <span className="font-mono text-[11px] opacity-60">{n}</span>
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section label="Recurring growth themes">
        {counts.improvements.length === 0 ? (
          <Muted>No repeated suggestions yet — a few more photos will surface them.</Muted>
        ) : (
          <ul className="space-y-2 text-[14px] leading-relaxed text-fg">
            {counts.improvements.map(([line, n]) => (
              <li key={line} className="flex gap-3">
                <span className="dot dot-accent mt-2" />
                <span>
                  {line}{" "}
                  <span className="text-[12px] text-fg3">
                    (came up in {n} photo{n === 1 ? "" : "s"})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section label="Photographers worth studying">
        {matchedPhotographers.length === 0 ? (
          <Muted>Once your genre profile fills in, relevant photographers appear here.</Muted>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {matchedPhotographers.map((m) => (
              <div key={m.photographer.id} className="card p-4">
                <div className="font-display text-[19px] leading-tight text-fg">
                  {m.photographer.name}
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-fg3">
                  {m.photographer.styles.join(" · ")}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-fg2">
                  {m.photographer.signature}
                </p>
                <p className="mt-2 text-[11px] text-fg3">
                  Overlaps with your {m.matchedStyles.join(", ")} work
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <div className="label mb-4">{label}</div>
      {children}
    </section>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return <p className="text-[13px] text-fg3">{children}</p>;
}

function BarList({ items, total }: { items: [string, number][]; total: number }) {
  if (items.length === 0) return <Muted>Not enough data yet.</Muted>;
  return (
    <div className="space-y-3">
      {items.map(([label, n]) => {
        // Bars show share of all frames, so six moods at one frame each read
        // as six short bars rather than six full-width ones.
        const share = Math.round((n / total) * 100);
        return (
          <div key={label} className="flex items-center gap-4">
            <span className="w-28 text-[13px] capitalize text-fg">{label}</span>
            <div className="bar flex-1">
              <i style={{ width: `${Math.max(share, 2)}%` }} />
            </div>
            <span className="w-16 text-right font-mono text-[11px] text-fg3">
              {n} · {share}%
            </span>
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

function matchPhotographers(genres: [string, number][], custom: Photographer[] = []) {
  const top = genres.slice(0, 3).map(([g]) => g as GenreTag);
  if (top.length === 0) return [];
  return [...custom, ...PHOTOGRAPHERS]
    .map((p) => {
      const overlap = p.styles.filter((s) => top.includes(s));
      return { photographer: p, matchedStyles: overlap };
    })
    .filter((m) => m.matchedStyles.length > 0)
    // Surface the user's own researched picks first when the match is equal.
    .sort(
      (a, b) =>
        b.matchedStyles.length - a.matchedStyles.length ||
        Number(!!b.photographer.custom) - Number(!!a.photographer.custom),
    )
    .slice(0, 6);
}
