import type { FoldId } from "./types";

// Imposition tables are data, not logic. A new fold (16-panel accordion, booklet)
// is a new entry here; nothing else in the pipeline needs to change.

export type ImpositionSlot = {
  page: number; // reading order, 1-based
  col: number; // 0 = left
  row: number; // 0 = top
  rotate: 0 | 180;
};

export type FoldSpec = {
  id: FoldId;
  name: string;
  cols: number;
  rows: number;
  pageCount: number;
  slots: ImpositionSlot[];
  /** Cut line as fractions of the sheet (y-down). */
  cutLine?: { y: number; x1: number; x2: number };
  /** Fold positions as fractions of the sheet, for edge tick marks. */
  foldGuides: { x: number[]; y: number[] };
};

export const IMPOSITION_8: ImpositionSlot[] = [
  { page: 5, col: 0, row: 0, rotate: 180 },
  { page: 4, col: 1, row: 0, rotate: 180 },
  { page: 3, col: 2, row: 0, rotate: 180 },
  { page: 2, col: 3, row: 0, rotate: 180 },
  { page: 6, col: 0, row: 1, rotate: 0 },
  { page: 7, col: 1, row: 1, rotate: 0 },
  { page: 8, col: 2, row: 1, rotate: 0 },
  { page: 1, col: 3, row: 1, rotate: 0 },
];

export const FOLDS: Record<FoldId, FoldSpec> = {
  mini8: {
    id: "mini8",
    name: "8-page mini",
    cols: 4,
    rows: 2,
    pageCount: 8,
    slots: IMPOSITION_8,
    cutLine: { y: 0.5, x1: 0.25, x2: 0.75 },
    foldGuides: { x: [0.25, 0.5, 0.75], y: [0.5] },
  },
};
