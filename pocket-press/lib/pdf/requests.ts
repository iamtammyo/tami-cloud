import { FOLDS } from "../folds";
import { PAPERS } from "../paper";
import { renderTestPage } from "../render/testPage";
import { zineRenderer } from "../render/zineRenderer";
import type { AssetMeta, PaperId, TypePack, Zine } from "../types";
import { buildSheetPdf } from "./sheet";

export type TestSheetRequest = { kind: "test"; paper: PaperId; cutLine: boolean; foldGuides: boolean };
export type ZineSheetRequest = {
  kind: "zine";
  zine: Zine;
  pack: TypePack;
  assets: Record<string, AssetMeta>;
  /** Photo files for every asset on the sheet. */
  blobs: Record<string, Blob>;
};
export type SheetRequest = TestSheetRequest | ZineSheetRequest;

export type Loaders = {
  loadFont: (file: string) => Promise<ArrayBuffer | Uint8Array>;
  onProgress?: (done: number, total: number) => void;
};

export function buildRequestPdf(req: SheetRequest, l: Loaders): Promise<Uint8Array> {
  if (req.kind === "test") {
    return buildSheetPdf({
      fold: FOLDS.mini8,
      paper: PAPERS[req.paper],
      renderPage: renderTestPage,
      cutLine: req.cutLine,
      foldGuides: req.foldGuides,
      title: "Pocket Press fold test",
      ...l,
    });
  }
  const { zine } = req;
  return buildSheetPdf({
    fold: FOLDS[zine.fold],
    paper: PAPERS[zine.paper],
    renderPage: zineRenderer(zine, req.pack, req.assets),
    cutLine: zine.print.cutLine,
    foldGuides: zine.print.foldGuides,
    title: zine.title,
    loadImage: async (id) => req.blobs[id],
    ...l,
  });
}
