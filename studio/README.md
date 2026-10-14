# Edit Bay

Caption-and-motion editing for short vertical videos, without a video app.
You style captions in the **Edit Bay** page (a Claude artifact with a live
preview); Claude renders the real video here with headless Chromium and ffmpeg.

Page: https://claude.ai/artifact/3a5mbjaZoxzj6pRFiDKZ7R

## How the pieces fit

| Piece | Job |
| --- | --- |
| `overlay.js` | Draws every caption at a given time. The page previews with it, and `render.mjs` draws export frames with the same file, so the preview matches the render. |
| `edit-bay.html` | The Edit Bay page: upload, caption cards (Text / Style / Place / Motion / Sound), live monitor, safe zones, notes for Claude, render history. Published with `overlay.js` and `sfx.js`. |
| `prepare.mjs` | Makes a web-friendly preview copy (under 18 MB) and caption segments from Whisper or an SRT file. |
| `render.mjs` | Renders `overlay.js` frame by frame in headless Chromium, composites it over the source in ffmpeg, and mixes in sound effects. Use `--preview` for a 720p copy under 18 MB. |
| `make-sfx.sh` | Synthesizes the pop / whoosh / click / ding effects (no samples, no licences) and rebuilds `sfx.js`. |
| `frame.html`, `fonts/` | The headless render page and the open-licence fonts it uses (the page loads the same families from Google Fonts). |

Setup: `cd studio && npm install`. ffmpeg must be on the path.

## The loop (for Claude)

The page's database has three parts:

- `project/main`: `source {assetId, name}`, `proxy {assetId}`, `video {w,h,fps,duration}`, `note {text, done}`, `render {status: requested|rendering|done|failed}`
- `segments/<id>`: `start`, `end`, `text`, `words [{s,e}]`, `look {style, place, y, size, motion, sfx}`, `changed`, `note {text, done}`
- `renders/<id>`: `assetId`, `at`, `label`

**"Prep my clip"**
1. Read `project/main`, download `source.assetId` with the Artifact tool (`action: read`, `path: <assetId>`). For a clip in Google Drive, download it with the Drive connector instead.
2. `node prepare.mjs <clip> --out work/<name>` (add `--srt file.srt` if there's no speech model).
3. Upload `work/<name>/proxy.mp4` as an asset, write `proxy` and `video` into `project/main`.
4. Batch-write `segments/<id>` from `edit.json` with a default `look`.

**"Apply my notes"**: read notes from `project/main` and `segments/*`, change `text` / `look` to match, set `changed: true` and `note.done: true`.

**"Render my edit"**
1. Set `render.status` to `rendering`.
2. Pull `segments/*` into an `edit.json`, run `node render.mjs <clip> edit.json out.mp4 --preview` (and without `--preview` for the full-quality file).
3. Upload the preview render as an asset, add `renders/<id>`, set `changed: false` on segments and `render.status: done`.
4. Give Tami the full-quality file.

## Styles, motions, sounds

- Styles: Block caps, Serif accent (`*word*` goes big and italic), Handwritten, Clean caption (`*word*` turns yellow), Sticker.
- Motions: None, Fade in, Pop, Slide up, Word by word (timed to the transcript).
- Sounds: Pop, Whoosh, Click, Ding, played on the cut into a caption.

## Known limits

- Speech-to-text loads `Xenova/whisper-small` from huggingface.co. When the network blocks it, use `--srt` with captions exported from CapCut, Instagram or Descript.
- Artifact uploads cap at 20 MB, so bigger clips go through Google Drive.
- Not built yet: text behind the speaker (needs person segmentation), zoom punch-ins, B-roll, and music beds.
