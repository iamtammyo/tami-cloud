import type { DrawOp, RenderContext } from "./ops";

// Step 1 placeholder pages for the paper test. Each page shows its number,
// an arrow pointing to its top, and the safe area, so after folding you can
// check order and orientation at a glance. Real layouts arrive in step 2 and
// produce the same kind of op list.

const INK = "#0A0A0A";
const SOFT = "#6E6E73";
const GUIDE = "#BDBDBD";

/** Captions and key content stay this far from any edge that touches the sheet edge. */
export const SAFE_OUTER_MM = 6;
const SAFE_INNER_MM = 3;

export function renderTestPage(pageNumber: number, ctx: RenderContext): DrawOp[] {
  const { w, h, ptPerMm, outer } = ctx;
  const inset = (isOuter: boolean) => (isOuter ? SAFE_OUTER_MM : SAFE_INNER_MM) * ptPerMm;
  const safe = {
    top: inset(outer.top),
    right: inset(outer.right),
    bottom: inset(outer.bottom),
    left: inset(outer.left),
  };
  const cx = w / 2;

  const label = pageNumber === 1 ? "FRONT COVER" : pageNumber === 8 ? "BACK COVER" : "PAGE";

  const arrowW = w * 0.08;
  const arrowTop = safe.top + h * 0.04;
  const arrowH = arrowW * 0.8;

  return [
    {
      kind: "rect",
      x: safe.left,
      y: safe.top,
      w: w - safe.left - safe.right,
      h: h - safe.top - safe.bottom,
      stroke: GUIDE,
      strokeWidth: 0.5,
      dash: [2, 2],
    },
    // "This way up" arrow
    {
      kind: "path",
      d: `M ${cx} ${arrowTop} L ${cx + arrowW / 2} ${arrowTop + arrowH} L ${cx - arrowW / 2} ${arrowTop + arrowH} Z`,
      fill: INK,
    },
    {
      kind: "text",
      x: cx,
      y: arrowTop + arrowH + w * 0.055,
      text: "TOP",
      size: w * 0.04,
      font: "sans-bold",
      color: INK,
      anchor: "middle",
    },
    {
      kind: "text",
      x: cx,
      y: h * 0.38,
      text: label,
      size: w * 0.055,
      font: "sans-bold",
      color: SOFT,
      anchor: "middle",
    },
    {
      kind: "text",
      x: cx,
      y: h * 0.66,
      text: String(pageNumber),
      size: w * 0.5,
      font: "sans-bold",
      color: INK,
      anchor: "middle",
    },
    {
      kind: "text",
      x: cx,
      y: h - safe.bottom - h * 0.025,
      text: `pocket press fold test  ${pageNumber} / 8`,
      size: w * 0.032,
      font: "sans",
      color: SOFT,
      anchor: "middle",
    },
  ];
}
