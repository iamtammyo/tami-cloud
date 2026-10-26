import type { Edges } from "../imposition";

// The shared Page renderer outputs a flat list of draw ops in page coordinates
// (points, origin top-left, y down). Two backends consume the same list:
// SVG for the editor / thumbnails / sheet preview, pdf-lib for the print PDF.
// That's what keeps every view of a page identical.

export type FontRef = "sans" | "sans-bold";

export type DrawOp =
  | {
      kind: "rect";
      x: number;
      y: number;
      w: number;
      h: number;
      r?: number;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      dash?: number[];
    }
  | {
      kind: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      stroke: string;
      strokeWidth: number;
      dash?: number[];
    }
  | {
      /** SVG path data in page coordinates (y down). */
      kind: "path";
      d: string;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
    }
  | {
      kind: "text";
      x: number;
      /** Baseline. */
      y: number;
      text: string;
      size: number;
      font: FontRef;
      color: string;
      anchor: "start" | "middle" | "end";
    };

export type RenderContext = {
  /** Page size in points. */
  w: number;
  h: number;
  ptPerMm: number;
  /** Edges of this page that land on the sheet's outer edge (printer margin). */
  outer: Edges;
};

export type PageRenderer = (pageNumber: number, ctx: RenderContext) => DrawOp[];

export function rectPath(x: number, y: number, w: number, h: number, r = 0): string {
  if (r <= 0) return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
  const k = Math.min(r, w / 2, h / 2);
  return [
    `M ${x + k} ${y}`,
    `H ${x + w - k}`,
    `A ${k} ${k} 0 0 1 ${x + w} ${y + k}`,
    `V ${y + h - k}`,
    `A ${k} ${k} 0 0 1 ${x + w - k} ${y + h}`,
    `H ${x + k}`,
    `A ${k} ${k} 0 0 1 ${x} ${y + h - k}`,
    `V ${y + k}`,
    `A ${k} ${k} 0 0 1 ${x + k} ${y}`,
    "Z",
  ].join(" ");
}
