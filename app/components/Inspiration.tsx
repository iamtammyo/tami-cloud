"use client";

import { useMemo, useState } from "react";
import { ALL_STYLES, PHOTOGRAPHERS, sampleUrl } from "../lib/photographers";
import type { GenreTag, Photographer } from "../lib/types";

type Sort = "name" | "style" | "era";

export default function Inspiration() {
  const [query, setQuery] = useState("");
  const [styleFilter, setStyleFilter] = useState<GenreTag | "all">("all");
  const [sort, setSort] = useState<Sort>("style");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = PHOTOGRAPHERS.filter((p) => {
      if (styleFilter !== "all" && !p.styles.includes(styleFilter)) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.signature.toLowerCase().includes(q) ||
        p.styles.some((s) => s.includes(q))
      );
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "era") return a.era.localeCompare(b.era);
      return a.styles[0].localeCompare(b.styles[0]) || a.name.localeCompare(b.name);
    });
    return list;
  }, [query, styleFilter, sort]);

  const grouped = useMemo(() => {
    if (sort !== "style") return null;
    const map = new Map<GenreTag, Photographer[]>();
    for (const p of filtered) {
      const key = p.styles[0];
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, sort]);

  return (
    <div>
      {/* Filter deck — feels like a viewfinder readout panel */}
      <div className="plate-black mb-8 rounded-md p-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="port h-3 w-3" />
          <span className="engrave-cream text-[10px] text-stone-300">
            REFERENCE INDEX · {PHOTOGRAPHERS.length.toString().padStart(3, "0")}{" "}
            PHOTOGRAPHERS ON FILE
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div>
            <Label>Search</Label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name · country · style…"
              className="input-port mt-1 w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <Label>Genre</Label>
            <select
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value as GenreTag | "all")}
              className="input-port mt-1 px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              {ALL_STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Group by</Label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="input-port mt-1 px-3 py-2 text-sm"
            >
              <option value="style">Style</option>
              <option value="name">Name</option>
              <option value="era">Era</option>
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-stone-400">No photographers match those filters.</p>
      )}

      {sort === "style" && grouped ? (
        <div className="space-y-10">
          {grouped.map(([style, list]) => (
            <section key={style}>
              <div className="plate-chrome mb-4 inline-flex items-center gap-3 rounded-sm px-3 py-1">
                <span className="led-red h-1.5 w-1.5" />
                <h2 className="engrave text-[11px]">CHANNEL · {style}</h2>
              </div>
              <CardGrid
                list={list}
                openId={openId}
                onOpen={(id) => setOpenId((cur) => (cur === id ? null : id))}
              />
            </section>
          ))}
        </div>
      ) : (
        <CardGrid
          list={filtered}
          openId={openId}
          onOpen={(id) => setOpenId((cur) => (cur === id ? null : id))}
        />
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="engrave-cream text-[10px] text-stone-400">{children}</span>
  );
}

function CardGrid({
  list,
  openId,
  onOpen,
}: {
  list: Photographer[];
  openId: string | null;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {list.map((p) => (
        <Card
          key={p.id}
          photographer={p}
          expanded={openId === p.id}
          onToggle={() => onOpen(p.id)}
        />
      ))}
    </div>
  );
}

function Card({
  photographer,
  expanded,
  onToggle,
}: {
  photographer: Photographer;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="plate-black overflow-hidden rounded-md">
      {/* Contact-sheet 4-up */}
      <div className="relative">
        <div className="grid grid-cols-2 gap-0.5 bg-black p-0.5">
          {photographer.sampleSeeds.slice(0, 4).map((seed) => (
            <img
              key={seed}
              src={sampleUrl(seed, 600, 400)}
              alt={`Sample evoking ${photographer.name}`}
              className="h-32 w-full object-cover"
              loading="lazy"
            />
          ))}
        </div>
        <span className="screw absolute left-1.5 top-1.5" />
        <span className="screw absolute right-1.5 top-1.5" />
      </div>

      {/* Chrome nameplate */}
      <div className="plate-chrome relative flex items-baseline justify-between gap-2 px-4 py-2">
        <h3 className="wordmark text-base engrave-deep">{photographer.name}</h3>
        <span className="engrave text-[10px]">{photographer.era}</span>
      </div>

      <div className="p-4">
        <div className="engrave-cream text-[10px] text-stone-400">
          {photographer.country}
        </div>
        <p className="mt-2 text-sm text-stone-300">{photographer.signature}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {photographer.styles.map((s) => (
            <span
              key={s}
              className="rounded-full border border-stone-700 bg-stone-950/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-stone-300"
            >
              {s}
            </span>
          ))}
        </div>
        <button
          onClick={onToggle}
          className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-stone-300 hover:text-stone-100"
        >
          <span className={`port h-2 w-2 ${expanded ? "led-red" : ""}`} />
          {expanded ? "Hide bio" : "Read more"}
        </button>
        {expanded && (
          <p className="mt-3 text-sm leading-relaxed text-stone-300">
            {photographer.bio}
          </p>
        )}
      </div>
    </div>
  );
}
