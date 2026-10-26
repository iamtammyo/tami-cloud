import { FOLDS } from "../folds";
import { PAPERS } from "../paper";
import { renderTestPage } from "../render/testPage";
import type { PaperId } from "../types";
import { buildSheetPdf } from "./sheet";

export type TestSheetRequest = { paper: PaperId; cutLine: boolean; foldGuides: boolean };

export function buildTestSheetPdf(req: TestSheetRequest): Promise<Uint8Array> {
  return buildSheetPdf({
    fold: FOLDS.mini8,
    paper: PAPERS[req.paper],
    renderPage: renderTestPage,
    cutLine: req.cutLine,
    foldGuides: req.foldGuides,
    title: "Pocket Press fold test",
  });
}
