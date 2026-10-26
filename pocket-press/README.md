# Pocket Press

Turn camera-roll photos into a print-ready, foldable 8-page mini zine. The full spec is in [BRIEF.md](./BRIEF.md).

This folder is a standalone Next.js app with its own `package.json`. It doesn't share code or dependencies with the rest of the repo.

## Status

**Step 1 of 7: imposition + PDF.** The app is a single fold-test page that downloads a one-sheet PDF of eight numbered placeholder pages. Step 2 waits until the paper test passes.

## Run it

```bash
cd pocket-press
npm install
npm run dev        # http://localhost:3100 (redirects to /fold-test)
npm test           # imposition + PDF unit tests
```

## Where things live

| Path | What it is |
| --- | --- |
| `lib/folds.ts` | `IMPOSITION_8` and the fold spec (cut line, fold guides). Data only. |
| `lib/paper.ts` | Sheet sizes in points. Panel sizes are always derived from these. |
| `lib/imposition.ts` | Panel geometry, slot matrices (SVG + PDF), which page edges hit the sheet edge. |
| `lib/render/ops.ts` | The draw-op format the shared Page renderer outputs. |
| `lib/render/testPage.ts` | Step 1 placeholder pages (number, TOP arrow, 6mm safe area). |
| `lib/render/sheetMarks.ts` | Cut line and fold-guide ticks. |
| `components/OpsSvg.tsx` | SVG backend: draws ops for previews. |
| `lib/pdf/drawOps.ts` | PDF backend: draws the same ops with pdf-lib. |
| `lib/pdf/sheet.ts` | Builds the imposed sheet PDF. Runs in a Web Worker (`export.worker.ts`). |
| `reference/` | Concept screenshots go here (Start, Editor, Type packs, Print). |
| `public/fonts/` | Type pack TTFs go here in step 3. |
