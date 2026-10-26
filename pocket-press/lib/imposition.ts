import type { FoldSpec, ImpositionSlot } from "./folds";
import type { Paper } from "./paper";

export type SheetGeometry = {
  sheetW: number;
  sheetH: number;
  /** Panel (page) width and height, derived from the sheet. Never hard-coded. */
  panelW: number;
  panelH: number;
};

export function sheetGeometry(fold: FoldSpec, paper: Paper): SheetGeometry {
  return {
    sheetW: paper.widthPt,
    sheetH: paper.heightPt,
    panelW: paper.widthPt / fold.cols,
    panelH: paper.heightPt / fold.rows,
  };
}

export type Rect = { x: number; y: number; w: number; h: number };

/** Panel rectangle in sheet coordinates, origin top-left, y down. */
export function panelRect(slot: ImpositionSlot, g: SheetGeometry): Rect {
  return { x: slot.col * g.panelW, y: slot.row * g.panelH, w: g.panelW, h: g.panelH };
}

/** 2D affine matrix [a, b, c, d, e, f], same convention as SVG matrix() and PDF cm. */
export type Matrix = [number, number, number, number, number, number];

/**
 * Maps an upright page (origin top-left, y down, size panelW × panelH) into its
 * panel on the sheet (also y down). Rotated slots use
 * translate(panelX + PW, panelY + PH) rotate(180°), so the page's top-left corner
 * lands on the panel's bottom-right corner.
 */
export function slotMatrix(slot: ImpositionSlot, g: SheetGeometry): Matrix {
  const r = panelRect(slot, g);
  return slot.rotate === 180 ? [-1, 0, 0, -1, r.x + r.w, r.y + r.h] : [1, 0, 0, 1, r.x, r.y];
}

/** Same placement for PDF space, where the origin is bottom-left and y points up. */
export function slotMatrixPdf(slot: ImpositionSlot, g: SheetGeometry): Matrix {
  const x = slot.col * g.panelW;
  const y = g.sheetH - (slot.row + 1) * g.panelH; // panel's bottom-left in PDF space
  return slot.rotate === 180 ? [-1, 0, 0, -1, x + g.panelW, y + g.panelH] : [1, 0, 0, 1, x, y];
}

export function applyMatrix(m: Matrix, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

export type Edges = { top: boolean; right: boolean; bottom: boolean; left: boolean };

/**
 * Which edges of the upright page sit on the outside edge of the sheet once imposed.
 * Home printers leave a 4–6mm white border there, so captions keep 6mm clear of them.
 */
export function outerEdges(slot: ImpositionSlot, fold: FoldSpec): Edges {
  const sheet = {
    top: slot.row === 0,
    bottom: slot.row === fold.rows - 1,
    left: slot.col === 0,
    right: slot.col === fold.cols - 1,
  };
  if (slot.rotate === 180) {
    return { top: sheet.bottom, right: sheet.left, bottom: sheet.top, left: sheet.right };
  }
  return sheet;
}

export function slotForPage(fold: FoldSpec, page: number): ImpositionSlot {
  const slot = fold.slots.find((s) => s.page === page);
  if (!slot) throw new Error(`Fold ${fold.id} has no slot for page ${page}`);
  return slot;
}
