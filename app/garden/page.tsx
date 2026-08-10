"use client";

import { useEffect, useMemo, useState } from "react";
import GardenIndex from "./components/GardenIndex";
import NoteEditor, { type NoteDraft } from "./components/NoteEditor";
import NoteReader from "./components/NoteReader";
import { exportJson, exportMarkdown, loadNotes, saveNotes } from "./lib/store";
import { uniqueId } from "./lib/text";
import {
  STAGE_META,
  STAGE_ORDER,
  type GardenNote,
  type GrowthStage,
} from "./lib/types";

type View =
  | { kind: "index" }
  | { kind: "note"; id: string }
  | { kind: "edit"; id: string | null; prefillTitle?: string };

export default function Garden() {
  const [notes, setNotes] = useState<GardenNote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>({ kind: "index" });
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<GrowthStage | null>(null);
  const [topicFilter, setTopicFilter] = useState<string | null>(null);

  useEffect(() => {
    setNotes(loadNotes());
    setLoaded(true);
  }, []);

  function update(next: GardenNote[]) {
    setNotes(next);
    saveNotes(next);
  }

  const topics = useMemo(() => {
    const set = new Set<string>();
    for (const n of notes) for (const t of n.topics) set.add(t.toLowerCase());
    return [...set].sort();
  }, [notes]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => {
      if (stageFilter && n.stage !== stageFilter) return false;
      if (
        topicFilter &&
        !n.topics.some((t) => t.toLowerCase() === topicFilter)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.topics.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [notes, query, stageFilter, topicFilter]);

  const current =
    view.kind === "note" || (view.kind === "edit" && view.id !== null)
      ? notes.find((n) => n.id === (view as { id: string }).id) ?? null
      : null;

  function saveDraft(draft: NoteDraft) {
    const now = new Date().toISOString();
    if (view.kind === "edit" && view.id !== null && current) {
      const next: GardenNote = {
        ...current,
        ...draft,
        id: uniqueId(draft.title, notes, current.id),
        tendedAt: now,
      };
      update(notes.map((n) => (n.id === current.id ? next : n)));
      setView({ kind: "note", id: next.id });
    } else {
      const note: GardenNote = {
        ...draft,
        id: uniqueId(draft.title, notes),
        plantedAt: now,
        tendedAt: now,
      };
      update([...notes, note]);
      setView({ kind: "note", id: note.id });
    }
  }

  function uproot(note: GardenNote) {
    if (
      !window.confirm(
        `Uproot “${note.title}”? It will be gone from the garden for good.`,
      )
    ) {
      return;
    }
    update(notes.filter((n) => n.id !== note.id));
    setView({ kind: "index" });
  }

  function wander() {
    const pool = visible.length > 0 ? visible : notes;
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setView({ kind: "note", id: pick.id });
  }

  const stageCounts = STAGE_ORDER.map(
    (s) => [s, notes.filter((n) => n.stage === s).length] as const,
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="text-center">
        <div className="g-smallcaps">
          established mmxxvi · tended in public · by tami
        </div>
        <h1 className="g-display mt-4 text-6xl font-semibold tracking-tight sm:text-7xl">
          The Digital Garden
        </h1>
        <p
          className="g-display mt-3 text-xl italic"
          style={{ color: "var(--ink-soft)" }}
        >
          a commonplace of half-formed thoughts, arranged by theme rather than
          time
        </p>
        <div className="g-ornament mx-auto mt-6 max-w-md">
          <span aria-hidden>❦</span>
        </div>
        <blockquote
          className="mx-auto mt-5 max-w-xl text-[0.98rem] italic"
          style={{ color: "var(--ink-faint)" }}
        >
          “The Garden is the web as topology… an arrangement and rearrangement
          of things to one another.” — Mike Caufield
        </blockquote>
      </header>

      <div className="g-rule-double mt-10" />

      {view.kind === "index" && (
        <>
          <nav className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="g-smallcaps g-smallcaps-dark">
              {notes.length} planting{notes.length === 1 ? "" : "s"}
              {stageCounts.map(([s, count]) =>
                count > 0 ? (
                  <span key={s}>
                    {" "}
                    · <span className={`stage-${s}`}>
                      {STAGE_META[s].glyph}
                    </span>{" "}
                    {count}
                  </span>
                ) : null,
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="g-input w-44 text-[0.95rem]"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search the beds…"
              />
              <button type="button" className="g-btn" onClick={wander}>
                wander ❀
              </button>
              <button
                type="button"
                className="g-btn g-btn-fig"
                onClick={() => setView({ kind: "edit", id: null })}
              >
                plant a thought
              </button>
            </div>
          </nav>

          <div className="g-rule mb-4" />

          <div className="mb-10 flex flex-wrap items-center gap-2">
            <span className="g-smallcaps mr-1">beds</span>
            <button
              type="button"
              className={`g-chip ${topicFilter === null ? "g-chip-active" : ""}`}
              onClick={() => setTopicFilter(null)}
            >
              all
            </button>
            {topics.map((t) => (
              <button
                key={t}
                type="button"
                className={`g-chip ${topicFilter === t ? "g-chip-active" : ""}`}
                onClick={() => setTopicFilter(topicFilter === t ? null : t)}
              >
                {t}
              </button>
            ))}
            <span className="g-smallcaps ml-auto mr-1">stages</span>
            {STAGE_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                className={`g-chip ${stageFilter === s ? "g-chip-active" : ""}`}
                onClick={() => setStageFilter(stageFilter === s ? null : s)}
                title={STAGE_META[s].hint}
              >
                {STAGE_META[s].glyph} {STAGE_META[s].label}
              </button>
            ))}
          </div>

          {loaded && <GardenIndex notes={visible} onOpen={(id) => setView({ kind: "note", id })} />}
        </>
      )}

      {view.kind === "note" && current && (
        <div className="py-10">
          <NoteReader
            note={current}
            notes={notes}
            onVisit={(id) => setView({ kind: "note", id })}
            onPlant={(title) =>
              setView({ kind: "edit", id: null, prefillTitle: title })
            }
            onEdit={() => setView({ kind: "edit", id: current.id })}
            onUproot={() => uproot(current)}
            onBack={() => setView({ kind: "index" })}
          />
        </div>
      )}

      {view.kind === "note" && !current && loaded && (
        <div className="py-20 text-center italic" style={{ color: "var(--ink-faint)" }}>
          That planting is gone.{" "}
          <button
            type="button"
            className="g-wikilink"
            onClick={() => setView({ kind: "index" })}
          >
            Back to the garden.
          </button>
        </div>
      )}

      {view.kind === "edit" && (
        <div className="py-10">
          <NoteEditor
            initial={current}
            prefillTitle={view.prefillTitle}
            onSave={saveDraft}
            onCancel={() =>
              setView(
                current
                  ? { kind: "note", id: current.id }
                  : { kind: "index" },
              )
            }
          />
        </div>
      )}

      <footer className="mt-20">
        <div className="g-rule-double" />
        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <span className="g-smallcaps">
            everything lives in this browser · nothing is sent anywhere
          </span>
          <span className="flex items-center gap-2">
            <span className="g-smallcaps g-smallcaps-dark">take cuttings</span>
            <button
              type="button"
              className="g-btn"
              onClick={() => exportMarkdown(notes)}
            >
              markdown
            </button>
            <button
              type="button"
              className="g-btn"
              onClick={() => exportJson(notes)}
            >
              json
            </button>
          </span>
        </div>
        <p
          className="pb-4 text-center text-[0.9rem] italic"
          style={{ color: "var(--ink-faint)" }}
        >
          ❧ a garden you cannot carry away is somebody else’s garden ❧
        </p>
      </footer>
    </main>
  );
}
