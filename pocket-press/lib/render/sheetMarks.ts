import type { FoldSpec } from "../folds";
import type { SheetGeometry } from "../imposition";
import type { DrawOp } from "./ops";

export const ACCENT = "#FF4D2E";
const GUIDE = "#BDBDBD";
const TICK_MM = 9;

export type SheetMarkOptions = { cutLine: boolean; foldGuides: boolean; ptPerMm: number };

/** Cut line and fold-guide ticks in sheet coordinates (y down). */
export function sheetMarks(fold: FoldSpec, g: SheetGeometry, o: SheetMarkOptions): DrawOp[] {
  const ops: DrawOp[] = [];
  const { sheetW: W, sheetH: H } = g;

  if (o.foldGuides) {
    // Ticks run 9mm in from the edge. Home printers clip the outer 4–6mm,
    // so the inner part of each tick still prints.
    const t = TICK_MM * o.ptPerMm;
    const tick = (x1: number, y1: number, x2: number, y2: number): DrawOp => ({
      kind: "line",
      x1,
      y1,
      x2,
      y2,
      stroke: GUIDE,
      strokeWidth: 0.5,
    });
    for (const fx of fold.foldGuides.x) {
      ops.push(tick(fx * W, 0, fx * W, t), tick(fx * W, H - t, fx * W, H));
    }
    for (const fy of fold.foldGuides.y) {
      ops.push(tick(0, fy * H, t, fy * H), tick(W - t, fy * H, W, fy * H));
    }
  }

  if (o.cutLine && fold.cutLine) {
    const c = fold.cutLine;
    ops.push({
      kind: "line",
      x1: c.x1 * W,
      y1: c.y * H,
      x2: c.x2 * W,
      y2: c.y * H,
      stroke: ACCENT,
      strokeWidth: 0.75,
      dash: [4, 3],
    });
  }

  return ops;
}
