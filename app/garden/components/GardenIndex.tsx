"use client";

import { excerpt, formatDate } from "../lib/text";
import type { GardenNote } from "../lib/types";
import StageMark from "./StageMark";

interface Props {
  notes: GardenNote[];
  onOpen: (id: string) => void;
}

const UNSORTED = "the wild patch";

/**
 * The table of contents, arranged as beds: notes grouped under their topics
 * (a note with several topics appears in several beds), alphabetical within
 * each bed. Topography over timelines.
 */
export default function GardenIndex({ notes, onOpen }: Props) {
  const beds = new Map<string, GardenNote[]>();
  for (const note of notes) {
    const topics = note.topics.length > 0 ? note.topics : [UNSORTED];
    for (const topic of topics) {
      const key = topic.toLowerCase();
      const bed = beds.get(key) ?? [];
      bed.push(note);
      beds.set(key, bed);
    }
  }
  const sortedBeds = [...beds.entries()].sort(([a], [b]) =>
    a === UNSORTED ? 1 : b === UNSORTED ? -1 : a.localeCompare(b),
  );

  if (notes.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="g-display text-3xl italic" style={{ color: "var(--ink-soft)" }}>
          Bare soil.
        </div>
        <p className="mt-3 italic" style={{ color: "var(--ink-faint)" }}>
          Nothing matches — clear a filter, or plant a thought.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {sortedBeds.map(([key, bed]) => (
        <section key={key}>
          <div className="mb-1 flex items-baseline justify-between gap-4">
            <h2 className="g-smallcaps g-smallcaps-dark text-[0.78rem]">
              {key}
            </h2>
            <span className="g-smallcaps">
              {bed.length} planting{bed.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="g-rule-double mb-2" />
          <div className="md:columns-2 md:gap-10">
            {[...bed]
              .sort((a, b) => a.title.localeCompare(b.title))
              .map((note) => (
                <button
                  key={note.id}
                  type="button"
                  className="g-entry"
                  onClick={() => onOpen(note.id)}
                >
                  <div className="flex items-baseline gap-2">
                    <StageMark stage={note.stage} />
                    <span className="g-entry-title">{note.title}</span>
                  </div>
                  <p
                    className="mt-1 text-[0.95rem] italic leading-snug"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    {excerpt(note.body, 120)}
                  </p>
                  <div className="g-smallcaps mt-2">
                    planted {formatDate(note.plantedAt)} · tended{" "}
                    {formatDate(note.tendedAt)}
                  </div>
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
