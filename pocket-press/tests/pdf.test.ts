import { readFileSync, writeFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { PAPERS } from "@/lib/paper";
import { BUILT_IN_PACKS } from "@/lib/packs";
import { printFileName } from "@/lib/pdf/fileName";
import { buildRequestPdf } from "@/lib/pdf/requests";
import { SAMPLE_META, SAMPLES } from "@/lib/samples";
import type { PaperId } from "@/lib/types";
import { sampleZine } from "@/lib/zine";

const loaders = { loadFont: async (file: string) => readFileSync(`public/fonts/${file}`) };
const out = process.env.PP_PDF_OUT;
const blobs = Object.fromEntries(
  SAMPLES.map((s) => [s.id, new Blob([readFileSync(`public${s.file}`)], { type: "image/jpeg" })]),
);

describe("test sheet PDF", () => {
  for (const paper of ["A3", "A4", "LETTER"] as PaperId[]) {
    it(`builds a single landscape ${paper} sheet`, async () => {
      const bytes = await buildRequestPdf({ kind: "test", paper, cutLine: true, foldGuides: true }, loaders);
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBe(1);
      const { width, height } = doc.getPage(0).getSize();
      expect(width).toBeCloseTo(PAPERS[paper].widthPt, 1);
      expect(height).toBeCloseTo(PAPERS[paper].heightPt, 1);
      if (out) writeFileSync(`${out}/fold-test-${paper}.pdf`, bytes);
    });
  }

  it("names the file {title}-{paper}-print.pdf", () => {
    expect(printFileName("Hoi An, March '26", PAPERS.A3)).toBe("hoi-an-march-26-A3-print.pdf");
  });
});

describe("zine PDF", () => {
  for (const pack of BUILT_IN_PACKS) {
    it(`builds the sample zine in ${pack.name}`, async () => {
      const zine = { ...sampleZine({ packId: pack.id }), paper: "A3" as const };
      const bytes = await buildRequestPdf({ kind: "zine", zine, pack, assets: SAMPLE_META, blobs }, loaders);
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBe(1);
      expect(bytes.length).toBeLessThan(10 * 1024 * 1024);
      if (out) writeFileSync(`${out}/sample-${pack.id}.pdf`, bytes);
    });
  }
});
