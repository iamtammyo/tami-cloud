"use client";

import type { FoldSpec } from "@/lib/folds";
import { outerEdges, panelRect, sheetGeometry, slotMatrix } from "@/lib/imposition";
import { PT_PER_MM, type Paper } from "@/lib/paper";
import type { PageRenderer } from "@/lib/render/ops";
import { sheetMarks } from "@/lib/render/sheetMarks";
import { OpsSvg } from "./OpsSvg";

/** Live preview of the imposed sheet, using the same renderer and placement as the PDF. */
export function SheetPreview({
  fold,
  paper,
  renderPage,
  cutLine,
  foldGuides,
  showPanels = true,
}: {
  fold: FoldSpec;
  paper: Paper;
  renderPage: PageRenderer;
  cutLine: boolean;
  foldGuides: boolean;
  showPanels?: boolean;
}) {
  const g = sheetGeometry(fold, paper);
  return (
    <svg
      viewBox={`0 0 ${g.sheetW} ${g.sheetH}`}
      className="block h-auto w-full rounded-[4px] border border-line"
      role="img"
      aria-label={`${paper.label} sheet with pages ${fold.slots.map((s) => s.page).join(", ")}. Top row upside down.`}
    >
      <rect width={g.sheetW} height={g.sheetH} fill="#FFFFFF" />
      {fold.slots.map((slot) => {
        const r = panelRect(slot, g);
        return (
          <g key={slot.page}>
            <g transform={`matrix(${slotMatrix(slot, g).join(" ")})`}>
              <OpsSvg
                ops={renderPage(slot.page, { w: g.panelW, h: g.panelH, ptPerMm: PT_PER_MM, outer: outerEdges(slot, fold) })}
              />
            </g>
            {/* Panel edges are preview-only, to show where the folds fall. */}
            {showPanels ? (
              <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke="#E8E8E8" strokeWidth={0.75} />
            ) : null}
          </g>
        );
      })}
      <OpsSvg ops={sheetMarks(fold, g, { cutLine, foldGuides, ptPerMm: PT_PER_MM })} />
    </svg>
  );
}
