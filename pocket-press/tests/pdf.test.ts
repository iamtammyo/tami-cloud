import { writeFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { PAPERS } from "@/lib/paper";
import { printFileName } from "@/lib/pdf/fileName";
import { buildTestSheetPdf } from "@/lib/pdf/testSheet";
import type { PaperId } from "@/lib/types";

describe("test sheet PDF", () => {
  for (const paper of ["A3", "A4", "LETTER"] as PaperId[]) {
    it(`builds a single landscape ${paper} sheet`, async () => {
      const bytes = await buildTestSheetPdf({ paper, cutLine: true, foldGuides: true });
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBe(1);
      const { width, height } = doc.getPage(0).getSize();
      expect(width).toBeCloseTo(PAPERS[paper].widthPt, 1);
      expect(height).toBeCloseTo(PAPERS[paper].heightPt, 1);
      // Set PP_PDF_OUT=/some/dir to write the sheets out for a visual check.
      if (process.env.PP_PDF_OUT) writeFileSync(`${process.env.PP_PDF_OUT}/fold-test-${paper}.pdf`, bytes);
    });
  }

  it("names the file {title}-{paper}-print.pdf", () => {
    expect(printFileName("Hoi An, March '26", PAPERS.A3)).toBe("hoi-an-march-26-A3-print.pdf");
  });
});
