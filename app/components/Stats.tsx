"use client";

import { useEffect, useMemo, useState } from "react";
import { loadProfile } from "../lib/storage";
import { loadAllPhotos } from "../lib/db";
import { buildPracticePrompts } from "../lib/practice";
import { recommendPhotographers } from "../lib/recommend";
import { useLibrary } from "../lib/library";
import type { StoredPhoto, UserProfile } from "../lib/types";

export default function Stats() {
  const [allPhotos, setAllPhotos] = useState<StoredPhoto[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const library = useLibrary();

  useEffect(() => {
    let alive = true;
    void loadAllPhotos().then((p) => {
      if (alive) setAllPhotos(p);
    });
    setProfile(loadProfile());

    function onProfileChange(e: Event) {
      const detail = (e as CustomEvent<UserProfile | null>).detail;
      setProfile(detail);
    }
    window.addEventListener("lensed:profile-changed", onProfileChange);
    return () => {
      alive = false;
      window.removeEventListener("lensed:profile-changed", onProfileChange);
    };
  }, []);

  // Only completed critiques feed the fingerprint.
  const photos = useMemo(
    () => allPhotos.filter((p) => p.analysis),
    [allPhotos],
  );
  const counts = useMemo(() => buildCounts(photos), [photos]);
  const practice = useMemo(
    () => buildPracticePrompts(photos, profile),
    [photos, profile],
  );

  if (photos.length === 0) {
    return (
      <div className="plate-black rounded-md px-8 py-16 text-center">
        <div className="engrave-cream text-[10px] text-stone-400">
          LIGHT METER · NO READING
        </div>
        <p className="mt-3 text-stone-200">No data yet.</p>
        <p className="mt-1 text-sm text-stone-500">
          Load a few photos in <span className="text-stone-300">Photos</span> and
          this panel will surface what you gravitate toward.
        </p>
      </div>
    );
  }

  const sampleCount = photos.length;
  const recommendations = recommendPhotographers(
    {
      genres: counts.genres,
      moods: counts.moods,
      subjects: counts.subjects,
      total: sampleCount,
    },
    6,
    library,
  );
  const isThin = sampleCount < 5;

  return (
    <div className="space-y-8">
      {/* Light meter readout */}
      <div className="plate-cream relative rounded-md px-5 py-4">
        <span className="screw absolute left-2 top-2" />
        <span className="screw absolute right-2 top-2" />
        <span className="screw absolute bottom-2 left-2" />
        <span className="screw absolute bottom-2 right-2" />
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="engrave-cream text-[10px]">LIGHT METER · YOUR FINGERPRINT</div>
            <h2 className="wordmark mt-1 text-2xl engrave-deep">
              {sampleCount.toString().padStart(3, "0")}{" "}
              <span className="text-base">FRAMES READ</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${isThin ? "led-red" : "led-green"}`} />
            <span className="engrave-cream text-[10px]">
              {isThin ? "LOW SAMPLE" : "READY"}
            </span>
          </div>
        </div>
        {isThin && (
          <p className="mt-3 text-xs text-stone-700">
            Patterns get more meaningful past ~10 uploads. Treat this as a sketch.
          </p>
        )}
      </div>

      {practice.length > 0 && (
        <section className="plate-cream relative rounded-md p-5">
          <span className="screw absolute left-2 top-2" />
          <span className="screw absolute right-2 top-2" />
          <span className="screw absolute bottom-2 left-2" />
          <span className="screw absolute bottom-2 right-2" />
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="engrave-cream text-[10px]">THIS WEEK · PRACTICE</div>
              <h3 className="wordmark mt-1 text-lg engrave-deep">
                EXERCISES BASED ON YOUR PATTERNS
              </h3>
            </div>
            <span className="led-green h-2.5 w-2.5" />
          </div>
          <ul className="mt-4 space-y-3">
            {practice.map((p) => (
              <li
                key={p.id}
                className="rounded-sm border border-stone-400/40 bg-white/40 p-3"
              >
                <div className="flex items-baseline gap-2">
                  <span className="led-red h-1.5 w-1.5 flex-none" />
                  <h4 className="font-medium text-stone-900">{p.title}</h4>
                </div>
                <p className="mt-1 pl-3.5 text-sm text-stone-800">{p.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Panel title="Genres you reach for">
        <BarList items={counts.genres} total={sampleCount} />
      </Panel>

      <Panel title="Moods that recur">
        <BarList items={counts.moods} total={sampleCount} />
      </Panel>

      <Panel title="Subjects you're drawn to">
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
      </Panel>

      <Panel title="Color palette tendencies">
        {counts.colors.length === 0 ? (
          <p className="text-sm text-stone-500">No palette signal yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {counts.colors.map(([word, n]) => (
              <span
                key={word}
                className="plate-cream rounded-sm px-3 py-1 text-[11px] uppercase tracking-wider"
              >
                {word} <span className="text-stone-600">×{n}</span>
              </span>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Recurring growth themes">
        {counts.improvements.length === 0 ? (
          <p className="text-sm text-stone-500">
            No repeated suggestions yet — load a few more photos.
          </p>
        ) : (
          <ul className="space-y-2 text-sm text-stone-200">
            {counts.improvements.map(([line, n]) => (
              <li key={line} className="flex gap-2">
                <span className="led-red mt-1.5 h-1.5 w-1.5 flex-none" />
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
      </Panel>

      <Panel title="Photographers worth studying">
        {recommendations.length === 0 ? (
          <p className="text-sm text-stone-500">
            Once your genre profile fills in, we'll surface relevant photographers.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {recommendations.map((m) => (
              <div
                key={m.photographer.id}
                className="rounded-md border border-stone-800 bg-stone-950/40 p-4"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <button
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("lensed:view-photographer", {
                          detail: { id: m.photographer.id },
                        }),
                      )
                    }
                    className="text-left font-medium text-stone-100 hover:underline"
                  >
                    {m.photographer.name} <span aria-hidden>↗</span>
                  </button>
                  <span className="flex items-center gap-2">
                    {m.photographer.contemporary && (
                      <span
                        className="rounded-full border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em]"
                        style={{
                          color: "var(--accent)",
                          borderColor: "var(--accent)",
                        }}
                      >
                        Now
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-stone-500">
                      {m.photographer.era}
                    </span>
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-stone-800">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round(m.strength * 100)}%`,
                        background: "var(--accent)",
                      }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-stone-500">
                    {Math.round(m.strength * 100).toString().padStart(3, "0")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-300">
                  {m.photographer.signature}
                </p>
                {m.reasons.length > 0 && (
                  <p className="mt-2 text-[11px] uppercase tracking-wider text-stone-500">
                    Why · {m.reasons.join(" · ")}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.photographer.styles.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-stone-700 px-2 py-0.5 text-[9px] uppercase tracking-wider text-stone-400"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="plate-black rounded-md p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="port h-2 w-2" />
        <h3 className="engrave-cream text-[10px] text-stone-300">{title}</h3>
      </div>
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
            <div className="w-32 text-sm uppercase tracking-wider text-stone-300">
              {label}
            </div>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full border border-black bg-stone-950">
              <div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: "var(--text-primary)",
                }}
              />
            </div>
            <div className="w-20 text-right font-mono text-xs text-stone-300">
              {n.toString().padStart(2, "0")} · {share}%
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
    if (!p.analysis) continue;
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
