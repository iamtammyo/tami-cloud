"use client";

import { backlinksFor, excerpt, formatDate } from "../lib/text";
import { STAGE_META, type GardenNote } from "../lib/types";
import NoteBody from "./NoteBody";
import StageMark from "./StageMark";

interface Props {
  note: GardenNote;
  notes: GardenNote[];
  onVisit: (id: string) => void;
  onPlant: (title: string) => void;
  onEdit: () => void;
  onUproot: () => void;
  onBack: () => void;
}

export default function NoteReader({
  note,
  notes,
  onVisit,
  onPlant,
  onEdit,
  onUproot,
  onBack,
}: Props) {
  const backlinks = backlinksFor(notes, note);

  return (
    <article className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <button type="button" className="g-btn" onClick={onBack}>
          ← the garden
        </button>
        <div className="flex gap-2">
          <button type="button" className="g-btn" onClick={onEdit}>
            tend
          </button>
          <button type="button" className="g-btn" onClick={onUproot}>
            uproot
          </button>
        </div>
      </div>

      <header className="text-center">
        <StageMark stage={note.stage} withLabel />
        <h1 className="g-display mt-3 text-5xl font-semibold leading-tight">
          {note.title}
        </h1>
        <p className="mt-3 italic" style={{ color: "var(--ink-faint)" }}>
          {STAGE_META[note.stage].hint}
        </p>
        <div className="g-smallcaps mt-4">
          planted {formatDate(note.plantedAt)} · last tended{" "}
          {formatDate(note.tendedAt)}
          {note.topics.length > 0 && <> · {note.topics.join(" · ")}</>}
        </div>
        <div className="g-ornament mx-auto mt-6 max-w-xs">
          <span aria-hidden>❦</span>
        </div>
      </header>

      <div className="mt-8 text-[1.1rem]">
        <NoteBody
          body={note.body}
          notes={notes}
          onVisit={onVisit}
          onPlant={onPlant}
          dropcap
        />
      </div>

      <footer className="mt-12">
        <div className="g-ornament mx-auto max-w-xs">
          <span aria-hidden>⁂</span>
        </div>
        <h2 className="g-smallcaps g-smallcaps-dark mt-6 text-center text-[0.78rem]">
          paths that lead here
        </h2>
        {backlinks.length === 0 ? (
          <p
            className="mt-3 text-center italic"
            style={{ color: "var(--ink-faint)" }}
          >
            No other planting links here yet. Mention{" "}
            <span className="g-display">[[{note.title}]]</span> elsewhere to
            grow a path.
          </p>
        ) : (
          <div className="mt-4 space-y-1">
            {backlinks.map((bl) => (
              <button
                key={bl.id}
                type="button"
                className="g-entry"
                onClick={() => onVisit(bl.id)}
              >
                <div className="flex items-baseline gap-2">
                  <StageMark stage={bl.stage} />
                  <span className="g-entry-title text-xl">{bl.title}</span>
                </div>
                <p
                  className="mt-0.5 text-[0.92rem] italic"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {excerpt(bl.body, 110)}
                </p>
              </button>
            ))}
          </div>
        )}
      </footer>
    </article>
  );
}
