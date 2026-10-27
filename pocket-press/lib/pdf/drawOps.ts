import {
  appendBezierCurve,
  clip,
  closePath,
  concatTransformationMatrix,
  degrees,
  endPath,
  lineTo,
  moveTo,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  setCharacterSpacing,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import type { Matrix } from "../imposition";
import { coverPlacement, rectPath, type DrawOp } from "../render/ops";

export type PdfFonts = Map<string, PDFFont>;
/** Embedded images keyed by image op. "cropped" images are already cut to the frame. */
export type PdfImages = Map<DrawOp, { image: PDFImage; cropped: boolean }>;

function color(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** Clip path for a rounded rect given in page coordinates (y down) on a page of height h. */
function roundedClip(page: PDFPage, x: number, y: number, w: number, hh: number, r: number, h: number) {
  const x0 = x;
  const x1 = x + w;
  const y0 = h - y - hh; // bottom in PDF space
  const y1 = h - y;
  const k = Math.min(r, w / 2, hh / 2);
  const c = k * 0.5523;
  if (k <= 0) {
    page.pushOperators(moveTo(x0, y0), lineTo(x1, y0), lineTo(x1, y1), lineTo(x0, y1), closePath(), clip(), endPath());
    return;
  }
  page.pushOperators(
    moveTo(x0 + k, y0),
    lineTo(x1 - k, y0),
    appendBezierCurve(x1 - k + c, y0, x1, y0 + k - c, x1, y0 + k),
    lineTo(x1, y1 - k),
    appendBezierCurve(x1, y1 - k + c, x1 - k + c, y1, x1 - k, y1),
    lineTo(x0 + k, y1),
    appendBezierCurve(x0 + k - c, y1, x0, y1 - k + c, x0, y1 - k),
    lineTo(x0, y0 + k),
    appendBezierCurve(x0, y0 + k - c, x0 + k - c, y0, x0 + k, y0),
    closePath(),
    clip(),
    endPath(),
  );
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
  images: PdfImages = new Map(),
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
        const font = fonts.get(op.font);
        if (!font || !op.text) break;
        const dx = op.anchor === "middle" ? op.width / 2 : op.anchor === "end" ? op.width : 0;
        const rot = ((op.rotate ?? 0) * Math.PI) / 180;
        // Rotate around the anchor point: shift the line start along the rotated baseline.
        const sx = op.x - dx * Math.cos(rot);
        const sy = op.y - dx * Math.sin(rot);
        page.pushOperators(pushGraphicsState(), setCharacterSpacing((op.tracking ?? 0) * op.size));
        page.drawText(op.text, {
          x: sx,
          y: h - sy,
          size: op.size,
          font,
          color: color(op.color),
          ...(op.rotate ? { rotate: degrees(-op.rotate) } : {}),
        });
        page.pushOperators(popGraphicsState());
        break;
      }
      case "image": {
        const img = images.get(op);
        if (img) {
          page.pushOperators(pushGraphicsState());
          roundedClip(page, op.x, op.y, op.w, op.h, op.r, h);
          const rect = img.cropped
            ? { x: op.x, y: op.y, w: op.w, h: op.h }
            : coverPlacement(op.imgW, op.imgH, op, op.crop).draw;
          page.drawImage(img.image, { x: rect.x, y: h - rect.y - rect.h, width: rect.w, height: rect.h });
          page.pushOperators(popGraphicsState());
        }
        if (op.stroke) {
          page.drawSvgPath(rectPath(op.x, op.y, op.w, op.h, op.r), {
            x: 0,
            y: h,
            borderColor: color(op.stroke),
            borderWidth: op.strokeWidth ?? 1,
          });
        }
        break;
      }
    }
  }

  page.pushOperators(popGraphicsState());
}
