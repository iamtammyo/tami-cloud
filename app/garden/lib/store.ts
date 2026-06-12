"use client";

import { SEED_NOTES } from "./seeds";
import type { GardenNote } from "./types";

const NOTES_KEY = "garden.notes.v1";
const SEEDED_KEY = "garden.seeded.v1";

export function loadNotes(): GardenNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(NOTES_KEY);
    if (!raw) {
      // First visit: plant the starter notes. The flag means an
      // intentionally emptied garden stays empty on later visits.
      if (!window.localStorage.getItem(SEEDED_KEY)) {
        window.localStorage.setItem(SEEDED_KEY, "1");
        window.localStorage.setItem(NOTES_KEY, JSON.stringify(SEED_NOTES));
        return SEED_NOTES;
      }
      return [];
    }
    const parsed = JSON.parse(raw) as GardenNote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNotes(notes: GardenNote[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  window.localStorage.setItem(SEEDED_KEY, "1");
}

function download(filename: string, mime: string, content: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportJson(notes: GardenNote[]): void {
  download(
    "digital-garden.json",
    "application/json",
    JSON.stringify(notes, null, 2),
  );
}

export function exportMarkdown(notes: GardenNote[]): void {
  const md = notes
    .map((n) =>
      [
        "---",
        `title: ${n.title}`,
        `stage: ${n.stage}`,
        `topics: ${n.topics.join(", ")}`,
        `planted: ${n.plantedAt}`,
        `tended: ${n.tendedAt}`,
        "---",
        "",
        n.body,
      ].join("\n"),
    )
    .join("\n\n\n");
  download("digital-garden.md", "text/markdown", md);
}
