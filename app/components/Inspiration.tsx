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
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs uppercase tracking-wide text-stone-500">
            Search
          </label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Photographer, country, style…"
            className="mt-1 w-full rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-sm outline-none focus:border-stone-400"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-stone-500">
            Style
          </label>
          <select
            value={styleFilter}
            onChange={(e) => setStyleFilter(e.target.value as GenreTag | "all")}
            className="mt-1 rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-sm outline-none focus:border-stone-400"
          >
            <option value="all">All styles</option>
            {ALL_STYLES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-stone-500">
            Group by
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="mt-1 rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-sm outline-none focus:border-stone-400"
          >
            <option value="style">Style</option>
            <option value="name">Name</option>
            <option value="era">Era</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-stone-400">No photographers match those filters.</p>
      )}

      {sort === "style" && grouped ? (
        <div className="space-y-10">
          {grouped.map(([style, list]) => (
            <section key={style}>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-stone-400">
                {style}
              </h2>
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
    <div className="overflow-hidden rounded-lg border border-stone-800 bg-stone-950/40">
      <div className="grid grid-cols-2 gap-0.5">
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
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-base font-medium">{photographer.name}</h3>
          <span className="text-xs text-stone-500">{photographer.era}</span>
        </div>
        <div className="mt-1 text-xs text-stone-400">{photographer.country}</div>
        <p className="mt-2 text-sm text-stone-300">{photographer.signature}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {photographer.styles.map((s) => (
            <span
              key={s}
              className="rounded-full border border-stone-700 px-2 py-0.5 text-xs text-stone-300"
            >
              {s}
            </span>
          ))}
        </div>
        <button
          onClick={onToggle}
          className="mt-3 text-xs text-stone-400 hover:text-stone-100"
        >
          {expanded ? "Hide bio" : "Read more"}
        </button>
        {expanded && (
          <p className="mt-2 text-sm leading-relaxed text-stone-300">
            {photographer.bio}
          </p>
        )}
        <div className="mt-3 text-[10px] text-stone-600">
          Samples are placeholder imagery seeded by photographer name; replace with
          curated work where licensing permits.
        </div>
      </div>
    </div>
  );
}
