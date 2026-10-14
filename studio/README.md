# Edit Bay

Caption-and-motion editing for short vertical videos, without a video app.
You style captions in the **Edit Bay** page (a Claude artifact with a live
preview); Claude renders the real video here with headless Chromium and ffmpeg.

Page: https://claude.ai/artifact/3a5mbjaZoxzj6pRFiDKZ7R

## How the pieces fit

| Piece | Job |
| --- | --- |
| `overlay.js` | Draws every caption at a given time. The page previews with it, and `render.mjs` draws export frames with the same file, so the preview matches the render. |
| `edit-bay.html` | The Edit Bay page: upload, Media tab for A-roll and B-roll, caption cards (Text / Style / Place / Motion / Sound / B-roll), clickable timeline, composited live monitor, safe zones, notes for Claude, render history. Published with `overlay.js` and `sfx.js`. |
| `prepare.mjs` | Makes a web-friendly preview copy (under 18 MB) and caption segments from Whisper or an SRT file. |
| `render.mjs` | Renders `overlay.js` frame by frame in headless Chromium, composites it over the source in ffmpeg, and mixes in sound effects. Use `--preview` for a 720p copy under 18 MB. |
| `collect.mjs` | Turns a dump of the page's database (plus downloaded clips) into the `edit.json` that `render.mjs` reads. |
| `sheet.mjs` | Contact sheet of 12 timestamped frames, so Claude can see what's in a clip when sorting A-roll and B-roll. |
| `make-sfx.sh` | Synthesizes the pop / whoosh / click / ding effects (no samples, no licences) and rebuilds `sfx.js`. |
| `frame.html`, `fonts/` | The headless render page and the open-licence fonts it uses (the page loads the same families from Google Fonts). |

Setup: `cd studio && npm install`. ffmpeg must be on the path.

## The loop (for Claude)

The page's database has four parts:

- `project/main`: `source {assetId, name, clipId}`, `video {w,h,fps,duration}`, `note {text, done}`, `render {status: requested|rendering|done|failed}`
- `clips/<id>`: `assetId`, `proxyAssetId`, `name`, `role` (`a`|`b`), `main`, `duration`, `w`, `h`, plus Claude's `desc`, `tags`, `suggestedRole`
- `segments/<id>`: `start`, `end`, `text`, `words [{s,e}]`, `look {style, place, y, size, motion, sfx}`, `broll {clipId, layout: full|pip|split, in, span, suggested, why}`, `changed`, `note {text, done}`
- `renders/<id>`: `assetId`, `at`, `label`

**"Prep my clips"**
1. List `clips`; download each asset into `work/media/<clipId>.<ext>` with the Artifact tool (`action: read`, `path: <assetId>`).
2. Main A-roll: `node prepare.mjs work/media/<id>.mp4 --out work/<id>` (add `--srt file.srt` when there's no speech model). Batch-write `segments/<id>` from `edit.json` with a default `look`.
3. Every clip: `node sheet.mjs <clip> sheet.jpg`, look at the sheet, write `desc`, `tags`, `suggestedRole`. Clips over ~18 MB or in odd formats get a proxy (`prepare.mjs --no-transcribe`) uploaded as `proxyAssetId`.
4. Suggest B-roll: match transcript lines to clip descriptions and write `broll {..., suggested: true, why}` on those segments.

**"Apply my notes"**: read notes from `project/main` and `segments/*`, change `text` / `look` to match, set `changed: true` and `note.done: true`.

**"Render my edit"**
1. Set `render.status` to `rendering`.
2. Dump `segments` and `clips` with ArtifactData (`out_dir`), run `node collect.mjs <dump> work/media edit.json`, then `node render.mjs <clip> edit.json out.mp4 --preview` (and without `--preview` for the full-quality file).
3. Upload the preview render as an asset, add `renders/<id>`, set `changed: false` on segments and `render.status: done`.
4. Give Tami the full-quality file.

## Styles, motions, sounds

- Styles: Block caps, Serif accent (`*word*` goes big and italic), Handwritten, Clean caption (`*word*` turns yellow), Sticker.
- Motions: None, Fade in, Pop, Slide up, Word by word (timed to the transcript).
- Sounds: Pop, Whoosh, Click, Ding, played on the cut into a caption.

## Known limits

- Speech-to-text loads `Xenova/whisper-small` from huggingface.co. When the network blocks it, use `--srt` with captions exported from CapCut, Instagram or Descript.
- Artifact uploads cap at 20 MB per file. Bigger clips need Google Drive, and downloading from Drive needs `drive.usercontent.google.com` allowed in the environment's network settings (the Drive connector returns whole files inline, which only works for small ones).
- B-roll is silent; the A-roll audio plays underneath.
- Not built yet: text behind the speaker (needs person segmentation), zoom punch-ins, multi-take A-roll stitching, and music beds.
