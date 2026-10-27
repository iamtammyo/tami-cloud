import fontkit from "@pdf-lib/fontkit";
import { Duplex, PDFDocument, PrintScaling } from "pdf-lib";
import { fontDef } from "../fonts";
import type { FoldSpec } from "../folds";
import { outerEdges, sheetGeometry, slotMatrixPdf } from "../imposition";
import { PT_PER_MM, type Paper } from "../paper";
import type { DrawOp, PageRenderer } from "../render/ops";
import { sheetMarks } from "../render/sheetMarks";
import { drawOpsPdf, type PdfFonts, type PdfImages } from "./drawOps";
import { prepareImage } from "./images";

export type SheetPdfOptions = {
  fold: FoldSpec;
  paper: Paper;
  renderPage: PageRenderer;
  cutLine: boolean;
  foldGuides: boolean;
  title: string;
  /** Returns a TTF from public/fonts by file name. */
  loadFont: (file: string) => Promise<ArrayBuffer | Uint8Array>;
  /** Returns the stored photo for an asset id. */
  loadImage?: (assetId: string) => Promise<Blob | undefined>;
  onProgress?: (done: number, total: number) => void;
};

/** Builds the one-sheet print PDF: every page drawn natively, imposed per the fold table. */
export async function buildSheetPdf(o: SheetPdfOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(o.title);
  doc.setCreator("Pocket Press");
  doc.setProducer("Pocket Press");

  // Ask viewers to print at actual size, one-sided. Not every viewer honours
  // this, which is why the UI still shows the "print at 100%" callout.
  const prefs = doc.catalog.getOrCreateViewerPreferences();
  prefs.setPrintScaling(PrintScaling.None);
  prefs.setDuplex(Duplex.Simplex);
  prefs.setPickTrayByPDFSize(true);

  const g = sheetGeometry(o.fold, o.paper);
  const page = doc.addPage([g.sheetW, g.sheetH]);

  const panels = o.fold.slots.map((slot) => ({
    slot,
    ops: o.renderPage(slot.page, { w: g.panelW, h: g.panelH, ptPerMm: PT_PER_MM, outer: outerEdges(slot, o.fold) }),
  }));
  const marks = sheetMarks(o.fold, g, { cutLine: o.cutLine, foldGuides: o.foldGuides, ptPerMm: PT_PER_MM });
  const allOps = [...panels.flatMap((p) => p.ops), ...marks];

  // Fonts: embed each one used, subset to the glyphs on the sheet.
  const fonts: PdfFonts = new Map();
  for (const id of new Set(allOps.flatMap((op) => (op.kind === "text" ? [op.font] : [])))) {
    const bytes = await o.loadFont(fontDef(id).file);
    fonts.set(id, await doc.embedFont(bytes, { subset: true, features: { liga: false } }));
  }

  // Photos: crop + resize each to its frame, then embed.
  const imageOps = allOps.filter((op): op is Extract<DrawOp, { kind: "image" }> => op.kind === "image");
  const images: PdfImages = new Map();
  let done = 0;
  o.onProgress?.(0, imageOps.length);
  for (const op of imageOps) {
    const blob = await o.loadImage?.(op.assetId);
    if (blob) {
      const prepared = await prepareImage(blob, op);
      const image = prepared.type === "png" ? await doc.embedPng(prepared.bytes) : await doc.embedJpg(prepared.bytes);
      images.set(op, { image, cropped: prepared.cropped });
    }
    o.onProgress?.(++done, imageOps.length);
  }

  for (const { slot, ops } of panels) {
    drawOpsPdf(page, ops, slotMatrixPdf(slot, g), { w: g.panelW, h: g.panelH }, fonts, images);
  }
  drawOpsPdf(page, marks, [1, 0, 0, 1, 0, 0], { w: g.sheetW, h: g.sheetH }, fonts);

  return doc.save();
}
