import type { PaperId } from "./types";

export const PT_PER_MM = 72 / 25.4;
export const PT_PER_IN = 72;

export type Paper = {
  id: PaperId;
  label: string;
  /** What each panel works out to, for the paper picker. */
  pageLabel: string;
  /** Landscape sheet size in PDF points. Panel sizes are always derived from this. */
  widthPt: number;
  heightPt: number;
};

// Sheet sizes are defined in their physical units and converted, so
// A3 = 1190.55 × 841.89pt and A4 = 841.89 × 595.28pt fall out exactly.
export const PAPERS: Record<PaperId, Paper> = {
  A3: { id: "A3", label: "A3", pageLabel: "A6 pages", widthPt: 420 * PT_PER_MM, heightPt: 297 * PT_PER_MM },
  A4: { id: "A4", label: "A4", pageLabel: "A7 pages", widthPt: 297 * PT_PER_MM, heightPt: 210 * PT_PER_MM },
  LETTER: { id: "LETTER", label: "US Letter", pageLabel: "2.75 × 4.25in pages", widthPt: 11 * PT_PER_IN, heightPt: 8.5 * PT_PER_IN },
};

export const PAPER_IDS: PaperId[] = ["A3", "A4", "LETTER"];
