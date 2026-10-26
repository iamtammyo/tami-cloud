import { Duplex, PDFDocument, PrintScaling, StandardFonts } from "pdf-lib";
import type { FoldSpec } from "../folds";
import { outerEdges, sheetGeometry, slotMatrixPdf } from "../imposition";
import { PT_PER_MM, type Paper } from "../paper";
import type { PageRenderer } from "../render/ops";
import { sheetMarks } from "../render/sheetMarks";
import { drawOpsPdf, type PdfFonts } from "./drawOps";

export type SheetPdfOptions = {
  fold: FoldSpec;
  paper: Paper;
  renderPage: PageRenderer;
  cutLine: boolean;
  foldGuides: boolean;
  title: string;
};

/** Builds the one-sheet print PDF: every page drawn natively, imposed per the fold table. */
export async function buildSheetPdf(o: SheetPdfOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
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
  const fonts: PdfFonts = {
    sans: await doc.embedFont(StandardFonts.Helvetica),
    "sans-bold": await doc.embedFont(StandardFonts.HelveticaBold),
  };

  for (const slot of o.fold.slots) {
    const ops = o.renderPage(slot.page, {
      w: g.panelW,
      h: g.panelH,
      ptPerMm: PT_PER_MM,
      outer: outerEdges(slot, o.fold),
    });
    drawOpsPdf(page, ops, slotMatrixPdf(slot, g), { w: g.panelW, h: g.panelH }, fonts);
  }

  const marks = sheetMarks(o.fold, g, { cutLine: o.cutLine, foldGuides: o.foldGuides, ptPerMm: PT_PER_MM });
  drawOpsPdf(page, marks, [1, 0, 0, 1, 0, 0], { w: g.sheetW, h: g.sheetH }, fonts);

  return doc.save();
}
