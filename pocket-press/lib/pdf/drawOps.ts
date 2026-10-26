import {
  concatTransformationMatrix,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type { Matrix } from "../imposition";
import { rectPath, type DrawOp, type FontRef } from "../render/ops";

export type PdfFonts = Record<FontRef, PDFFont>;

function color(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/**
 * Draws a list of ops (page coordinates, y down, size w × h) onto a PDF page.
 * `m` places the page's bottom-left corner in PDF space; a 180° slot is just a
 * different matrix, so rotation never touches the ops themselves.
 */
export function drawOpsPdf(
  page: PDFPage,
  ops: DrawOp[],
  m: Matrix,
  size: { w: number; h: number },
  fonts: PdfFonts,
) {
  const { h } = size;
  page.pushOperators(pushGraphicsState(), concatTransformationMatrix(...m));

  for (const op of ops) {
    switch (op.kind) {
      case "rect":
      case "path": {
        const d = op.kind === "rect" ? rectPath(op.x, op.y, op.w, op.h, op.r) : op.d;
        // drawSvgPath reads the path in SVG space (y down) from the given origin,
        // so placing the origin at the page's top-left needs no conversion.
        page.drawSvgPath(d, {
          x: 0,
          y: h,
          ...(op.fill ? { color: color(op.fill) } : {}),
          ...(op.stroke
            ? {
                borderColor: color(op.stroke),
                borderWidth: op.strokeWidth ?? 1,
                ...(op.kind === "rect" && op.dash ? { borderDashArray: op.dash } : {}),
              }
            : {}),
        });
        break;
      }
      case "line":
        page.drawLine({
          start: { x: op.x1, y: h - op.y1 },
          end: { x: op.x2, y: h - op.y2 },
          thickness: op.strokeWidth,
          color: color(op.stroke),
          ...(op.dash ? { dashArray: op.dash } : {}),
        });
        break;
      case "text": {
        const font = fonts[op.font];
        const width = font.widthOfTextAtSize(op.text, op.size);
        const dx = op.anchor === "middle" ? width / 2 : op.anchor === "end" ? width : 0;
        page.drawText(op.text, { x: op.x - dx, y: h - op.y, size: op.size, font, color: color(op.color) });
        break;
      }
    }
  }

  page.pushOperators(popGraphicsState());
}
