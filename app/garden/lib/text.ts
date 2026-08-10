import type { GardenNote } from "./types";

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "untitled";
}

export function uniqueId(
  title: string,
  notes: GardenNote[],
  exceptId?: string,
): string {
  const base = slugify(title);
  let id = base;
  let n = 2;
  while (notes.some((note) => note.id === id && note.id !== exceptId)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

/** Titles referenced as [[Wiki Links]] inside a note body. */
export function extractLinkTitles(body: string): string[] {
  const matches = body.match(/\[\[([^\]]+)\]\]/g) ?? [];
  return matches.map((m) => m.slice(2, -2).trim()).filter(Boolean);
}

export function findByTitle(
  notes: GardenNote[],
  title: string,
): GardenNote | undefined {
  const needle = title.trim().toLowerCase();
  return notes.find((n) => n.title.trim().toLowerCase() === needle);
}

/** Notes whose bodies link to the given note — the "paths that lead here". */
export function backlinksFor(
  notes: GardenNote[],
  note: GardenNote,
): GardenNote[] {
  const needle = note.title.trim().toLowerCase();
  return notes.filter(
    (n) =>
      n.id !== note.id &&
      extractLinkTitles(n.body).some((t) => t.toLowerCase() === needle),
  );
}

/** Plain-text preview with wiki/markdown furniture stripped. */
export function excerpt(body: string, max = 150): string {
  const plain = body
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^-\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
