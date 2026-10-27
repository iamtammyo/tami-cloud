"use client";

import { useMemo } from "react";
import { FOLDS } from "@/lib/folds";
import { outerEdges, sheetGeometry, slotForPage } from "@/lib/imposition";
import { PAPERS, PT_PER_MM } from "@/lib/paper";
import { zineRenderer } from "@/lib/render/zineRenderer";
import type { AssetMeta, TypePack, Zine } from "@/lib/types";
import { PageSvg } from "./PageSvg";

/** Page `n` of a zine at its real print size, with the same safe margins it gets on the sheet. */
export function ZinePage({
  zine,
  pack,
  assets,
  n,
  variant = "full",
  className,
  label,
}: {
  zine: Zine;
  pack: TypePack;
  assets: Record<string, AssetMeta>;
  n: number;
  variant?: "full" | "thumb";
  className?: string;
  label?: string;
}) {
  const fold = FOLDS[zine.fold];
  const g = sheetGeometry(fold, PAPERS[zine.paper]);
  const ops = useMemo(
    () =>
      zineRenderer(zine, pack, assets)(n, {
        w: g.panelW,
        h: g.panelH,
        ptPerMm: PT_PER_MM,
        outer: outerEdges(slotForPage(fold, n), fold),
      }),
    [zine, pack, assets, n, g.panelW, g.panelH, fold],
  );
  return <PageSvg ops={ops} w={g.panelW} h={g.panelH} variant={variant} className={className} label={label ?? pageLabel(zine, n)} />;
}

export function pageLabel(zine: Zine, n: number) {
  const p = zine.pages[n - 1];
  if (n === 1) return `Cover: ${zine.title}`;
  if (n === zine.pages.length) return `Back cover: ${zine.title}`;
  const where = [p?.caption?.location, p?.caption?.date].filter(Boolean).join(", ");
  return where ? `Page ${n}: ${where}` : `Page ${n}`;
}
