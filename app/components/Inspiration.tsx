"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PHOTOGRAPHERS } from "../lib/photographers";
import { loadCustomPhotographers, saveCustomPhotographers } from "../lib/storage";
import { initials, usePhotographerWiki } from "../lib/wiki";
import type { GenreTag, Photographer, SourceTier } from "../lib/types";

const TIER_LABEL: Record<SourceTier, string> = {
  institution: "Museum / gallery",
  personal: "Their own site",
  press: "Press",
  reference: "Reference",
  other: "Other",
};

type Sort = "name" | "style" | "era";

export default function Inspiration() {
  const [custom, setCustom] = useState<Photographer[]>([]);
  const [query, setQuery] = useState("");
  const [styleFilter, setStyleFilter] = useState<GenreTag | "all">("all");
  // Flat grid by default: grouping by style leaves most genres with one or
  // two cards and a lot of dead space. Grouping stays available in the menu.
  const [sort, setSort] = useState<Sort>("name");
  const [openId, setOpenId] = useState<string | null>(null);

  const [researchName, setResearchName] = useState("");
  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  useEffect(() => {
    setCustom(loadCustomPhotographers());
  }, []);

  const library = useMemo(() => [...custom, ...PHOTOGRAPHERS], [custom]);

  const allStyles = useMemo(
    () => Array.from(new Set(library.flatMap((p) => p.styles))).sort(),
    [library],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = library.filter((p) => {
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
  }, [library, query, styleFilter, sort]);

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

  async function research() {
    const name = researchName.trim();
    if (!name) return;

    const dupe = library.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (dupe) {
      setResearchError(`${dupe.name} is already in your library.`);
      return;
    }

    setResearching(true);
    setResearchError(null);
    try {
      const res = await fetch("/api/photographer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { photographer?: Photographer; error?: string };
      if (!res.ok || !data.photographer) {
        throw new Error(data.error ?? `Research failed (${res.status})`);
      }

      const entry: Photographer = { ...data.photographer, addedAt: Date.now() };
      // Guard against an id collision with a built-in entry.
      if (library.some((p) => p.id === entry.id)) {
        entry.id = `${entry.id}-${Date.now().toString(36)}`;
      }

      const next = [entry, ...custom];
      setCustom(next);
      saveCustomPhotographers(next);
      setResearchName("");
      setJustAddedId(entry.id);
      setOpenId(entry.id);
    } catch (err) {
      setResearchError(err instanceof Error ? err.message : String(err));
    } finally {
      setResearching(false);
    }
  }

  function removeCustom(id: string) {
    const p = custom.find((x) => x.id === id);
    if (!p) return;
    if (!window.confirm(`Remove ${p.name} from your library?`)) return;
    const next = custom.filter((x) => x.id !== id);
    setCustom(next);
    saveCustomPhotographers(next);
  }

  const onOpen = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <input
            value={researchName}
            onChange={(e) => {
              setResearchName(e.target.value);
              setResearchError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !researching) research();
            }}
            placeholder="Add a photographer — e.g. Ming Smith"
            className="input min-w-[240px] flex-1"
            disabled={researching}
          />
          <button onClick={research} disabled={researching || !researchName.trim()} className="btn">
            {researching ? "Researching…" : "Research"}
          </button>
        </div>
        {researching && (
          <p className="flex items-center gap-2 text-[12px] text-fg3">
            <span className="dot dot-accent animate-pulse" />
            Searching galleries, magazines, and archives… (10–30s)
          </p>
        )}
        {researchError && (
          <p className="text-[12px]" style={{ color: "var(--accent)" }}>
            {researchError}
          </p>
        )}
        {!researching && !researchError && (
          <p className="text-[12px] text-fg3">
            Searches the web and prefers museums, galleries, the photographer&apos;s own site,
            and photography press. Every card lists the pages it read.
          </p>
        )}
      </section>

      <div className="flex flex-wrap items-end gap-3 border-b border-hair pb-5">
        <div className="min-w-[200px] flex-1">
          <Label>Search</Label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, country, style…"
            className="input mt-1.5 w-full"
          />
        </div>
        <div>
          <Label>Genre</Label>
          <select
            value={styleFilter}
            onChange={(e) => setStyleFilter(e.target.value as GenreTag | "all")}
            className="input mt-1.5"
          >
            <option value="all">All</option>
            {allStyles.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Arrange</Label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="input mt-1.5"
          >
            <option value="name">By name</option>
            <option value="era">By era</option>
            <option value="style">Grouped by style</option>
          </select>
        </div>
        <span className="ml-auto self-center font-mono text-[11px] text-fg3">
          {library.length} on file
          {custom.length > 0 && ` · ${custom.length} yours`}
        </span>
      </div>

      {filtered.length === 0 && (
        <p className="text-[14px] text-fg2">No photographers match those filters.</p>
      )}

      {sort === "style" && grouped ? (
        <div className="space-y-12">
          {grouped.map(([style, list]) => (
            <section key={style}>
              <div className="mb-4 flex items-center gap-3">
                <span className="label">{style}</span>
                <span className="h-px flex-1 bg-hair" />
              </div>
              <CardGrid
                list={list}
                openId={openId}
                justAddedId={justAddedId}
                onOpen={onOpen}
                onDelete={removeCustom}
              />
            </section>
          ))}
        </div>
      ) : (
        <CardGrid
          list={filtered}
          openId={openId}
          justAddedId={justAddedId}
          onOpen={onOpen}
          onDelete={removeCustom}
        />
      )}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <span className="label block">{children}</span>;
}

function CardGrid({
  list,
  openId,
  justAddedId,
  onOpen,
  onDelete,
}: {
  list: Photographer[];
  openId: string | null;
  justAddedId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {list.map((p) => (
        <Card
          key={p.id}
          photographer={p}
          expanded={openId === p.id}
          highlight={justAddedId === p.id}
          onToggle={() => onOpen(p.id)}
          onDelete={() => onDelete(p.id)}
        />
      ))}
    </div>
  );
}

function Card({
  photographer,
  expanded,
  highlight,
  onToggle,
  onDelete,
}: {
  photographer: Photographer;
  expanded: boolean;
  highlight: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { info, loading } = usePhotographerWiki(photographer.wikipediaTitle);

  // Phones get a row (portrait left, text right); wider screens a column.
  return (
    <article
      className="card flex overflow-hidden sm:flex-col"
      style={highlight ? { borderColor: "var(--accent)" } : undefined}
    >
      <div className="relative w-[104px] shrink-0 self-stretch bg-elev2 sm:aspect-[4/3] sm:w-auto sm:self-auto">
        {loading ? (
          <div className="absolute inset-0 grid place-items-center text-[11px] text-fg3">
            Loading…
          </div>
        ) : info?.imageUrl ? (
          <img
            src={info.imageUrl}
            alt={`Portrait of ${photographer.name}`}
            className="fade-in absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center font-display text-[28px] text-fg3 sm:text-[40px]">
            {initials(photographer.name)}
          </div>
        )}
        {photographer.custom && (
          <span
            className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-hair px-2 py-0.5 text-[10px] font-medium text-fg"
            style={{ background: "var(--bg-elev)" }}
          >
            <span className="dot dot-accent" />
            Researched
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-[20px] leading-tight text-fg sm:text-[22px]">
            {photographer.name}
          </h3>
          <div className="mt-1 font-mono text-[11px] text-fg3">
            {photographer.era} · {photographer.country}
          </div>
        </div>
        <p className="text-[13px] leading-relaxed text-fg2">{photographer.signature}</p>
        {photographer.quote && (
          <p className="hidden font-display text-[15px] italic leading-snug text-fg3 sm:block">
            “{photographer.quote}”
          </p>
        )}
        {photographer.note && (
          <p
            className="rounded-md px-2.5 py-1.5 text-[12px] text-fg"
            style={{ background: "var(--accent-soft)" }}
          >
            {photographer.note}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {photographer.styles.map((s) => (
            <span key={s} className="chip py-0.5 text-[11px]">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between pt-2 text-[12px]">
          <button onClick={onToggle} className="text-fg2 transition-colors hover:text-fg">
            {expanded ? "Less" : "Read more"}
          </button>
          <div className="flex items-center gap-3">
            {photographer.custom && (
              <button onClick={onDelete} className="text-fg3 transition-colors hover:text-accent">
                Remove
              </button>
            )}
            {info?.contentUrl && (
              <a
                href={info.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg3 transition-colors hover:text-fg"
              >
                Wikipedia ↗
              </a>
            )}
          </div>
        </div>

        {expanded && (
          <div className="space-y-4 border-t border-hair pt-4">
            <p className="text-[14px] leading-relaxed text-fg">{photographer.bio}</p>

            {photographer.website && (
              <a
                href={photographer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-[12px] text-fg2 underline decoration-hairs underline-offset-4 hover:text-fg"
              >
                Their own site ↗
              </a>
            )}

            {photographer.sources && photographer.sources.length > 0 && (
              <div>
                <div className="label">
                  Sources
                  {typeof photographer.searchCount === "number" &&
                    photographer.searchCount > 0 &&
                    ` · ${photographer.searchCount} search${
                      photographer.searchCount === 1 ? "" : "es"
                    }`}
                </div>
                <ul className="mt-2 space-y-1.5">
                  {photographer.sources.map((s) => (
                    <li key={s.url} className="text-[12px] leading-snug">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-fg2 underline decoration-hairs underline-offset-4 hover:text-fg"
                      >
                        {s.title}
                      </a>
                      <span className="ml-1.5 text-fg3">{TIER_LABEL[s.tier]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
