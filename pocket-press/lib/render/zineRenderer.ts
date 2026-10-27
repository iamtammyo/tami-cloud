import { findPack } from "../packs";
import type { AssetMeta, TypePack, Zine } from "../types";
import { dateRange } from "../zine";
import type { PageRenderer } from "./ops";
import { renderPage } from "./page";

/** Binds a zine, its pack and asset metadata into a PageRenderer for previews and the PDF. */
export function zineRenderer(zine: Zine, pack: TypePack, assets: Record<string, AssetMeta>): PageRenderer {
  const range = dateRange(zine);
  return (n, ctx) => {
    const page = zine.pages[n - 1];
    if (!page) return [];
    return renderPage({ page, zineTitle: zine.title, dateRange: range, pack, assets }, ctx);
  };
}

export function packFor(zine: Zine, custom: TypePack[] = []) {
  return findPack(zine.typePackId, custom);
}
