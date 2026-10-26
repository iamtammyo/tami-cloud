import { describe, expect, it } from "vitest";
import { FOLDS, IMPOSITION_8 } from "@/lib/folds";
import { applyMatrix, outerEdges, panelRect, sheetGeometry, slotMatrix, slotMatrixPdf } from "@/lib/imposition";
import { PAPERS, PT_PER_MM } from "@/lib/paper";

const fold = FOLDS.mini8;
const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 2);

describe("paper sizes", () => {
  it("matches the brief's sheet sizes in points", () => {
    close(PAPERS.A3.widthPt, 1190.55);
    close(PAPERS.A3.heightPt, 841.89);
    close(PAPERS.A4.widthPt, 841.89);
    close(PAPERS.A4.heightPt, 595.28);
    expect(PAPERS.LETTER.widthPt).toBe(792);
    expect(PAPERS.LETTER.heightPt).toBe(612);
  });

  it("derives panel sizes from the sheet", () => {
    const a3 = sheetGeometry(fold, PAPERS.A3);
    close(a3.panelW / PT_PER_MM, 105);
    close(a3.panelH / PT_PER_MM, 148.5);
    const a4 = sheetGeometry(fold, PAPERS.A4);
    close(a4.panelW / PT_PER_MM, 74.25);
    close(a4.panelH / PT_PER_MM, 105);
    const letter = sheetGeometry(fold, PAPERS.LETTER);
    close(letter.panelW / 72, 2.75);
    close(letter.panelH / 72, 4.25);
  });
});

describe("IMPOSITION_8", () => {
  it("is exactly the table in the brief", () => {
    expect(IMPOSITION_8).toEqual([
      { page: 5, col: 0, row: 0, rotate: 180 },
      { page: 4, col: 1, row: 0, rotate: 180 },
      { page: 3, col: 2, row: 0, rotate: 180 },
      { page: 2, col: 3, row: 0, rotate: 180 },
      { page: 6, col: 0, row: 1, rotate: 0 },
      { page: 7, col: 1, row: 1, rotate: 0 },
      { page: 8, col: 2, row: 1, rotate: 0 },
      { page: 1, col: 3, row: 1, rotate: 0 },
    ]);
  });

  it("uses every page and every panel exactly once", () => {
    expect(new Set(IMPOSITION_8.map((s) => s.page)).size).toBe(8);
    expect(new Set(IMPOSITION_8.map((s) => `${s.col},${s.row}`)).size).toBe(8);
  });

  it("puts the cut line across columns 2 and 3 on the centre line", () => {
    expect(fold.cutLine).toEqual({ y: 0.5, x1: 0.25, x2: 0.75 });
  });
});

describe("placement", () => {
  const g = sheetGeometry(fold, PAPERS.A3);

  for (const slot of IMPOSITION_8) {
    it(`page ${slot.page} lands inside its panel, ${slot.rotate ? "upside down" : "upright"}`, () => {
      const r = panelRect(slot, g);
      const m = slotMatrix(slot, g);
      const topLeft = applyMatrix(m, 0, 0);
      const bottomRight = applyMatrix(m, g.panelW, g.panelH);
      if (slot.rotate === 180) {
        // Page top-left sits at the panel's bottom-right: the page is turned over.
        close(topLeft[0], r.x + r.w);
        close(topLeft[1], r.y + r.h);
        close(bottomRight[0], r.x);
        close(bottomRight[1], r.y);
      } else {
        close(topLeft[0], r.x);
        close(topLeft[1], r.y);
        close(bottomRight[0], r.x + r.w);
        close(bottomRight[1], r.y + r.h);
      }
    });

    it(`page ${slot.page}: PDF matrix agrees with the SVG matrix`, () => {
      // Convert a page point through the SVG (y-down) path, then flip into PDF space,
      // and compare with the PDF matrix applied to the same point in y-up page space.
      const [sx, sy] = applyMatrix(slotMatrix(slot, g), 10, 20);
      const [px, py] = applyMatrix(slotMatrixPdf(slot, g), 10, g.panelH - 20);
      close(px, sx);
      close(py, g.sheetH - sy);
    });
  }

  it("page tops all meet at the sheet's centre line", () => {
    for (const slot of IMPOSITION_8) {
      const [, yTop] = applyMatrix(slotMatrix(slot, g), g.panelW / 2, 0);
      close(yTop, g.sheetH / 2);
    }
  });
});

describe("outer edges", () => {
  it("page bottoms always sit on the sheet's outer edge", () => {
    for (const slot of IMPOSITION_8) {
      const e = outerEdges(slot, fold);
      expect(e.bottom).toBe(true);
      expect(e.top).toBe(false);
    }
  });

  it("knows which side edges touch the sheet edge after rotation", () => {
    const bySlot = (p: number) => outerEdges(IMPOSITION_8.find((s) => s.page === p)!, fold);
    expect(bySlot(5)).toMatchObject({ left: false, right: true }); // col 0, rotated
    expect(bySlot(2)).toMatchObject({ left: true, right: false }); // col 3, rotated
    expect(bySlot(6)).toMatchObject({ left: true, right: false }); // col 0, upright
    expect(bySlot(1)).toMatchObject({ left: false, right: true }); // col 3, upright
    expect(bySlot(4)).toMatchObject({ left: false, right: false });
  });
});
