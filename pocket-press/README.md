# Pocket Press

Turn camera-roll photos into a print-ready, foldable 8-page mini zine. The spec is [BRIEF.md](./BRIEF.md); the approved visual direction is [reference/DIRECTION.md](./reference/DIRECTION.md).

This folder is a standalone Next.js app with its own `package.json`. It shares no code or dependencies with the rest of the repo.

## Run it

```bash
cd pocket-press
npm install
npm run dev        # http://localhost:3100
npm test           # imposition, renderer, model and PDF tests
npm run build
```

Click **Try with sample photos** on the start screen to get a filled-in zine straight away.

## Screens

| Route | What it is |
| --- | --- |
| `/` | Start: fold + look, sticky summary bar |
| `/editor/[id]` | Editor: page rail (drag 2–7 to reorder), page canvas (drop, click, pan), camera roll, layout / type pack / page colour / auto captions, Preview fold |
| `/print/[id]` | Print: live imposed sheet, paper, marks, copies, Download print PDF, fold steps |
| `/packs` | Type packs: filter, Use, Mix your own (with the 14pt-at-A7 readability check) |
| `/zines` | My zines (saved in this browser) |
| `/print-shops` | Static print-shop help |
| `/fold-test` | The step 1 numbered test sheet |
| `/api/place` | Reverse geocoding for auto captions (Nominatim, BigDataCloud fallback, cached) |

## How it fits together

- **One renderer.** `lib/render/page.ts` turns a page into a list of draw ops. `components/OpsSvg.tsx` draws them as SVG (editor, thumbnails, sheet preview, cards) and `lib/pdf/drawOps.ts` draws the same ops with pdf-lib. Text is measured with metrics generated from the actual TTFs (`data/fontMetrics.json`), so line breaks match in both.
- **Imposition is data.** `lib/folds.ts` holds `IMPOSITION_8`. The PDF places each page with a per-slot matrix; the top row is a 180° matrix, not mirrored drawing.
- **Layouts, packs, looks and fonts are JSON** in `data/`. Adding a pack or layout is adding a row.
- **PDF export** runs in a Web Worker: fonts embedded and subset, photos cropped to their frame at 300dpi as JPEG q0.88.
- **Storage** is IndexedDB via Dexie (`lib/db.ts`): zines, photo blobs, cached place names, custom packs. `lib/store.ts` (Zustand) autosaves the open zine.

## Adding things

- **A type pack:** add a row to `data/typePacks.json`. If it needs a new font, drop the TTF in `public/fonts`, add it to `data/fonts.json`, then run `node scripts/gen-font-metrics.mjs`.
- **A layout:** add an entry to `data/layouts.json` (all numbers are % of the page). Set `"pickable": true` to offer it in the editor.
- **Sample photos:** `python3 scripts/gen-samples.py` regenerates `public/samples` and `data/samples.json`.
