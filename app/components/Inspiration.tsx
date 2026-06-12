"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addCustomPhotographer,
  findPhotographerByName,
  isCustomPhotographer,
  removeCustomPhotographer,
  slugForName,
  useLibrary,
} from "../lib/library";
import { useCommonsImages } from "../lib/commons";
import { initials, usePhotographerWiki } from "../lib/wiki";
import type { GenreTag, Photographer } from "../lib/types";

type ViewMode = "grid" | "index";

export default function Inspiration({
  focusId = null,
  onFocusConsumed,
}: {
  focusId?: string | null;
  onFocusConsumed?: () => void;
}) {
  const photographers = useLibrary();
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<GenreTag | "all">("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addName, setAddName] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const styleCounts = useMemo(() => {
    const map = new Map<GenreTag, number>();
    for (const p of photographers) {
      for (const s of p.styles) map.set(s, (map.get(s) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [photographers]);

  // Arriving from a critique chip or Stats recommendation: open the
  // detail view directly.
  useEffect(() => {
    if (!focusId) return;
    setQuery("");
    setGenre("all");
    setDetailId(focusId);
    onFocusConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  async function addByName() {
    const name = addName.trim();
    if (!name || addBusy) return;
    setAddError(null);
    const existing = findPhotographerByName(name, photographers);
    if (existing) {
      setAddName("");
      setDetailId(existing.id);
      return;
    }
    setAddBusy(true);
    try {
      const res = await fetch("/api/photographer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as {
        profile?: Omit<Photographer, "id">;
        error?: string;
      };
      if (!res.ok || !data.profile) {
        throw new Error(data.error ?? `Add failed (${res.status})`);
      }
      const photographer: Photographer = {
        id: slugForName(data.profile.name),
        ...data.profile,
      };
      addCustomPhotographer(photographer);
      setAddName("");
      setDetailId(photographer.id);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : String(err));
    } finally {
      setAddBusy(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return photographers
      .filter((p) => {
        if (genre !== "all" && !p.styles.includes(genre)) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q) ||
          p.signature.toLowerCase().includes(q) ||
          p.styles.some((s) => s.includes(q))
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [photographers, query, genre]);

  const detail = detailId
    ? photographers.find((p) => p.id === detailId) ?? null
    : null;

  return (
    <div>
      {/* Slim header: search · add · view */}
      <div className="plate-black mb-6 rounded-md p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <span className="engrave-cream text-[10px]">Search</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name · country · style…"
                className="input-port mt-1 block w-56 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <span className="engrave-cream text-[10px]">Add a photographer</span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void addByName();
                  }}
                  placeholder="e.g. Gordon Parks"
                  className="input-port w-48 px-3 py-2 text-sm"
                />
                <button
                  onClick={() => void addByName()}
                  disabled={addBusy || !addName.trim()}
                  className="btn-chrome px-4 py-2 text-[10px] uppercase tracking-[0.18em]"
                >
                  <span className="engrave">{addBusy ? "Researching…" : "Add"}</span>
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(
              [
                ["grid", "Grid"],
                ["index", "Index"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setView(id)}
                aria-pressed={view === id}
                className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] transition ${
                  view === id
                    ? "bg-stone-200 text-stone-900"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {addError && (
          <p className="mt-2 text-xs" style={{ color: "var(--accent)" }}>
            {addError}
          </p>
        )}
      </div>

      {/* Typographic filter index — the structure you operate, not scroll */}
      <div className="mb-8 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[11px] uppercase tracking-wider">
        <IndexButton
          active={genre === "all"}
          onClick={() => setGenre("all")}
          label="all"
          count={photographers.length}
        />
        {styleCounts.map(([s, n]) => (
          <IndexButton
            key={s}
            active={genre === s}
            onClick={() => setGenre(s)}
            label={s}
            count={n}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-stone-400">No photographers match those filters.</p>
      )}

      {view === "grid" ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((p) => (
            <GridCard key={p.id} photographer={p} onOpen={() => setDetailId(p.id)} />
          ))}
        </div>
      ) : (
        <IndexTable list={filtered} onOpen={setDetailId} />
      )}

      {detail && (
        <DetailView
          photographer={detail}
          pool={photographers}
          onClose={() => setDetailId(null)}
          onOpen={setDetailId}
        />
      )}
    </div>
  );
}

function IndexButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="transition"
      style={{ color: active ? "var(--accent)" : undefined }}
    >
      <span className={active ? "" : "text-stone-400 hover:text-stone-200"}>
        {label}{" "}
        <span className={active ? "opacity-70" : "text-stone-600"}>
          {count.toString().padStart(2, "0")}
        </span>
      </span>
    </button>
  );
}

/** Sublime-style quiet card: image, a caption line, whitespace. */
function GridCard({
  photographer,
  onOpen,
}: {
  photographer: Photographer;
  onOpen: () => void;
}) {
  const { info, loading } = usePhotographerWiki(photographer.wikipediaTitle);
  return (
    <button onClick={onOpen} className="group text-left">
      <div className="aspect-[3/4] w-full overflow-hidden rounded-sm bg-stone-900 ring-1 ring-transparent transition group-hover:ring-stone-400">
        {info?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={info.imageUrl}
            alt={`Portrait of ${photographer.name}`}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-stone-800 text-2xl font-light tracking-widest text-stone-400">
            {loading ? "…" : initials(photographer.name)}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {photographer.contemporary && (
          <span
            className="h-1.5 w-1.5 flex-none rounded-full"
            style={{ background: "var(--accent)" }}
            title="Contemporary"
          />
        )}
        <span className="truncate text-sm text-stone-100">{photographer.name}</span>
      </div>
      <div className="font-mono text-[10px] text-stone-500">
        {photographer.era} · {photographer.styles[0]}
      </div>
    </button>
  );
}

/** Are.na-style index: the fastest way to scan a growing library. */
function IndexTable({
  list,
  onOpen,
}: {
  list: Photographer[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-stone-800 font-mono text-[10px] uppercase tracking-wider text-stone-500">
            <th className="py-2 pr-4 font-normal">Name</th>
            <th className="py-2 pr-4 font-normal">Era</th>
            <th className="hidden py-2 pr-4 font-normal sm:table-cell">Country</th>
            <th className="py-2 font-normal">Styles</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr
              key={p.id}
              onClick={() => onOpen(p.id)}
              className="cursor-pointer border-b border-stone-800/60 transition hover:bg-stone-950/60"
            >
              <td className="py-2.5 pr-4 text-sm text-stone-100">
                <span className="flex items-center gap-1.5">
                  {p.contemporary && (
                    <span
                      className="h-1.5 w-1.5 flex-none rounded-full"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
                  {p.name}
                </span>
              </td>
              <td className="py-2.5 pr-4 font-mono text-[11px] text-stone-400">
                {p.era}
              </td>
              <td className="hidden py-2.5 pr-4 text-sm text-stone-400 sm:table-cell">
                {p.country}
              </td>
              <td className="py-2.5 font-mono text-[10px] uppercase tracking-wider text-stone-500">
                {p.styles.join(" · ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Affinity by shared styles and moods — the are.na "connected to" idea. */
function relatedPhotographers(
  p: Photographer,
  pool: Photographer[],
  n = 4,
): Photographer[] {
  return pool
    .filter((x) => x.id !== p.id)
    .map((x) => {
      let score = 0;
      for (const s of x.styles) {
        if (p.styles.includes(s)) {
          score += s === p.styles[0] || s === x.styles[0] ? 2 : 1.5;
        }
      }
      for (const m of x.moods ?? []) {
        if ((p.moods ?? []).includes(m)) score += 1;
      }
      return { x, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((r) => r.x);
}

function DetailView({
  photographer,
  pool,
  onClose,
  onOpen,
}: {
  photographer: Photographer;
  pool: Photographer[];
  onClose: () => void;
  onOpen: (id: string) => void;
}) {
  const { info, loading } = usePhotographerWiki(photographer.wikipediaTitle);
  const { urls } = useCommonsImages(photographer.name, true, 8);
  const custom = isCustomPhotographer(photographer);
  const connected = relatedPhotographers(photographer, pool);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="plate-black max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-md p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={photographer.name}
      >
        <div className="flex items-start gap-5">
          <div className="h-36 w-28 flex-none overflow-hidden rounded-sm bg-stone-900">
            {info?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={info.imageUrl}
                alt={`Portrait of ${photographer.name}`}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-light tracking-widest text-stone-500">
                {loading ? "…" : initials(photographer.name)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-semibold text-stone-100">
                {photographer.name}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="font-mono text-sm text-stone-500 hover:text-stone-200"
              >
                ✕
              </button>
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-stone-500">
              {photographer.era} · {photographer.country}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {photographer.contemporary && (
                <span
                  className="rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                  style={{ color: "var(--accent)", borderColor: "var(--accent)" }}
                >
                  now
                </span>
              )}
              {custom && (
                <span className="rounded-full border border-stone-600 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-stone-400">
                  added by you
                </span>
              )}
              {photographer.styles.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-stone-700 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-stone-400"
                >
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm text-stone-200">{photographer.signature}</p>
          </div>
        </div>

        {photographer.quote && (
          <blockquote
            className="mt-4 border-l-2 pl-3 text-sm italic text-stone-400"
            style={{ borderColor: "var(--accent)" }}
          >
            “{photographer.quote}”
          </blockquote>
        )}

        <p className="mt-4 text-sm leading-relaxed text-stone-300">
          {photographer.bio}
        </p>

        {urls.length > 0 && (
          <div className="mt-5">
            <div className="engrave-cream text-[10px]">Work · Wikimedia Commons</div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {urls.map((u) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={u}
                  src={u}
                  alt={`Work associated with ${photographer.name}`}
                  className="aspect-square w-full rounded-sm object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          </div>
        )}

        {connected.length > 0 && (
          <div className="mt-5">
            <div className="engrave-cream text-[10px]">Connected</div>
            <div className="mt-2 space-y-1">
              {connected.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onOpen(c.id)}
                  className="block w-full text-left text-sm text-stone-300 transition hover:text-stone-100"
                >
                  <span className="text-stone-100">{c.name}</span>{" "}
                  <span className="font-mono text-[10px] text-stone-500">
                    {c.styles[0]} · {c.era}
                  </span>{" "}
                  <span aria-hidden className="text-stone-600">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-stone-800 pt-3">
          {info?.contentUrl ? (
            <a
              href={info.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-400 hover:text-stone-100"
            >
              Wikipedia ↗
            </a>
          ) : (
            <span />
          )}
          {custom && (
            <button
              onClick={() => {
                if (window.confirm(`Remove ${photographer.name} from your library?`)) {
                  removeCustomPhotographer(photographer.id);
                  onClose();
                }
              }}
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500 hover:text-red-400"
            >
              Remove from library
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
