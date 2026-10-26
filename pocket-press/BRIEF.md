# Pocket Press: Claude Code build brief

26 Oct 2026 · Tamilore Oladipo

## What we're building

Pocket Press is a web app that turns camera-roll photos into a print-ready, foldable zine in one sitting. The user picks a fold and a look, drops photos onto pages, and downloads one PDF sheet that folds into a booklet with a single cut.

The value is the part people find scary: page order, upside-down panels and the cut line are handled for them. Fonts and layouts are the delight on top.

**MVP scope (build this first):**

- One fold: the 8-page, one-cut mini zine, printed on A3 (A6 pages) or A4 (A7 pages).
- Six page layouts and nine type packs (specs below).
- Photo upload with auto-captions from photo location and date.
- Print-ready PDF download with the sheet imposed correctly.
- No accounts. Projects saved locally in the browser.

**Out of MVP:** the 16-panel accordion, stapled booklets, print-shop ordering, sharing, custom font uploads.

## User flow and the four screens

The flow is linear: Start → Editor → Print. Type packs is a library screen people can open from the nav at any time.

### 1. Start: fold + look

- **Header:** wordmark "pocket press", nav (My zines, Type packs, Print), and a "New zine" pill button.
- **Hero:** H1 "Make a zine from your camera roll." plus one line of supporting copy.
- **01 Fold:** four format cards, each with a tiny sheet diagram. Only "8-page mini" is active in the MVP. The other three (16-panel accordion, Pocket mini, Stapled booklet) show a "Soon" tag.
- **02 Look:** six look cards. Each one previews a real cover in its type pack (Postcard, Park day, Market, Field diary, Solid cover, Note page).
- **Sticky summary bar:** shows the chosen fold and look, with an "Add photos" button that creates the zine and opens the editor.
- **Selected state:** a 1.5px solid border in the foreground colour. No fills, no glow.

### 2. Editor

- **Top bar:** editable zine title (e.g. "Hoi An, March '26"), a "Preview fold" button and a "Print" button.
- **Left rail:** eight page thumbnails in reading order. Click to select, drag to reorder pages 2 to 7. The cover (1) and back (8) stay fixed.
- **Centre:** the selected page at a large size, with a dashed drop zone when it's empty. Below it is the camera roll, grouped by place using a segmented control.
- **Right panel:**
  - Layout picker: icon buttons for the layouts that suit that page.
  - Type pack: a dropdown with a live preview.
  - Page colour: swatches from the pack, plus a custom colour.
  - Auto captions: an on/off switch.
- **Drag and drop:** dragging a photo onto the page fills the frame. Clicking a photo in the roll fills the selected page.
- **Captions:** when auto captions are on, the caption fills itself from the photo metadata (see "Photo metadata and auto captions"). It stays editable inline.

### 3. Type packs

- A grid of nine packs. Each card shows a sample title and caption row in the pack's colours.
- A filter: All, Script, Display, Serif, Handwritten.
- "Use": applies the pack to the current zine. If no zine is open, it starts a new one.
- "Mix your own": pick a title font and a caption font, then save it as a custom pack (stored locally).

### 4. Print + fold

- **Headline:** "One sheet. One cut. One zine."
- **Preview:** a live preview of the imposed sheet, with the top row rotated and the cut line drawn in the accent colour.
- **Paper options:** A3 → A6 pages, A4 → A7 pages, US Letter.
- **Copies:** a number field, which only affects the PDF if we add multi-copy sheets later.
- **"Download print PDF":** the main action.
- **"Find a print shop":** a secondary link, which can be a static help page in the MVP.
- **"Fold in four moves":** short illustrated steps (fold in half long-ways, cut the middle, push into a plus shape, flatten into a book).

## Imposition logic

This is the core of the product, so get it exactly right before touching anything visual. People design pages in reading order (1 to 8). The app rearranges them onto one landscape sheet so that a single fold-cut-fold turns the sheet into a booklet.

### Sheet grid

The sheet is landscape and split into 4 columns × 2 rows of equal panels. Each panel is one page.

|                          | Column 1 | Column 2 | Column 3            | Column 4             |
| ------------------------ | -------- | -------- | ------------------- | -------------------- |
| Top row (rotated 180°)   | Page 5   | Page 4   | Page 3              | Page 2               |
| Bottom row (upright)     | Page 6   | Page 7   | Page 8 (back cover) | Page 1 (front cover) |

### Paper sizes

- A3 landscape (420 × 297mm): panels are 105 × 148.5mm, which is A6.
- A4 landscape (297 × 210mm): panels are 74.25 × 105mm, which is A7.
- US Letter landscape (11 × 8.5in): panels are 2.75 × 4.25in.

Always compute panel sizes from the sheet size. Never hard-code them.

### The cut line

- **Where:** a horizontal line on the vertical centre of the sheet (y = 50%). It runs from x = 25% to x = 75%, so it only crosses columns 2 and 3.
- **How it looks:** draw it as a dashed line in the accent colour (#FF4D2E) in the preview.
- **In the PDF:** make it optional. It's on by default as a thin dashed line, and can be turned off for people who'd rather mark it in pencil.
- **Fold guides:** optionally draw light tick marks at the sheet edges, at x = 25%, 50% and 75% and at y = 50%.

### Rotating the top row

The top row must be upside down, or pages 2 to 5 come out inverted once folded. Two equivalent ways to do it:

1. **Transform (preferred):** render the page upright, then place it with `translate(panelX + PW, panelY + PH) rotate(180°)`. In pdf-lib, draw the page as an embedded page or XObject with `rotate: degrees(180)` at the panel's opposite corner.
2. **Manual mirroring:** for each element at (x, y, w, h) in panel coordinates, draw it at x' = PW − x − w and y' = PH − y − h, rotated 180°. This is only needed if the renderer can't rotate a whole group.

### Implementation rule

Build one Page renderer that draws a page upright at any size. The editor canvas, the thumbnails, the sheet preview and the PDF export should all use it. Imposition then just maps page index to panel position and rotation:

```ts
const IMPOSITION_8 = [
  { page: 5, col: 0, row: 0, rotate: 180 },
  { page: 4, col: 1, row: 0, rotate: 180 },
  { page: 3, col: 2, row: 0, rotate: 180 },
  { page: 2, col: 3, row: 0, rotate: 180 },
  { page: 6, col: 0, row: 1, rotate: 0 },
  { page: 7, col: 1, row: 1, rotate: 0 },
  { page: 8, col: 2, row: 1, rotate: 0 },
  { page: 1, col: 3, row: 1, rotate: 0 },
];
```

Keep this as data, not logic, so the 16-panel and booklet folds can be added later as new tables.

### Print gotchas to handle in the UI

- **Print at 100% / actual size:** home printers default to "fit to page", which shrinks the sheet and breaks the fold. Show a callout above the download button.
- **Home printers leave a white edge of about 4 to 6mm:** keep captions and key content 6mm in from each panel edge that touches the sheet edge.
- **One-sided only:** this fold is one-sided. The inside of the sheet stays blank.

## Data model

Keep it small and serialisable. Everything lives in the browser in the MVP: IndexedDB for photos (blobs), plus a JSON record per zine.

```ts
type FoldId = 'mini8';            // later: 'accordion16' | 'pocket' | 'booklet'
type PaperId = 'A3' | 'A4' | 'LETTER';

type Zine = {
  id: string;
  title: string;                  // "Hoi An, March '26"
  fold: FoldId;
  paper: PaperId;
  typePackId: string;
  pages: Page[];                  // always 8 for mini8, index 0 = page 1
  createdAt: string;
  updatedAt: string;
};

type LayoutId = 'cover' | 'land_top' | 'land_low' | 'portrait' | 'full' | 'note' | 'back';

type Page = {
  index: number;                  // 1-8, reading order
  layout: LayoutId;
  bgColor?: string;               // overrides the pack default
  photo?: {
    assetId: string;              // key into IndexedDB
    crop: { x: number; y: number; scale: number }; // pan + zoom inside the frame
  };
  title?: string;                 // cover and note pages
  body?: string;                  // note page
  caption?: {
    num: string;                  // "[02]", auto from page index
    location: string;             // "Minh An, Hoi An"
    date: string;                 // "15.03.26"
    auto: boolean;                // false once the user edits it
  };
};

type Asset = {
  id: string;
  blob: Blob;                     // downscaled original, long edge 3000px
  thumb: Blob;                    // long edge 400px for the roll + thumbnails
  width: number;
  height: number;
  takenAt?: string;               // from EXIF DateTimeOriginal
  gps?: { lat: number; lng: number };
  place?: string;                 // reverse-geocoded, cached
};

type TypePack = {
  id: string;
  name: string;                   // "Field diary"
  category: 'script' | 'display' | 'serif' | 'handwritten';
  titleFont: { family: string; weight: number; style?: 'italic'; size: number; leading: number; tracking?: number; rotate?: number };
  captionFont: { family: string; weight: number; size: number };
  colors: { bg: string; fg: string; accent?: string };
  custom?: boolean;               // made with "Mix your own"
};
```

**Default page layouts for a new mini8 zine:**

- Page 1: `cover`
- Pages 2 to 6: `land_top`, `portrait`, `full`, `land_low`, `land_top`
- Page 7: `note`
- Page 8: `back`

This matches the Canva kit's print sheet, and it means the first preview already looks varied.

## Layouts and type packs

### Page layouts

All values are percentages of the panel (page) width and height, so the same layout works on A6, A7 and Letter. The look is borrowed from the travel-zine style that inspired this: a lot of white space, one photo per page, and a small mono caption row.

| Layout     | Photo frame (x, y, w, h) | Caption row (y) | Notes |
| ---------- | ------------------------ | --------------- | ----- |
| `land_top` | 7%, 10%, 86%, 44%        | 56%             | Landscape photo in the upper half, empty space below |
| `land_low` | 7%, 38%, 86%, 44%        | 84%             | Same frame, pushed down |
| `portrait` | 7%, 10%, 86%, 76%        | 88%             | Tall photo, caption tucked under it |
| `full`     | 0%, 0%, 100%, 100%       | 3.5% and 94%    | Full bleed; caption text switches to the pack's light or dark colour for contrast |
| `cover`    | 7%, 30%, 86%, 58%        | 93%             | Big title in the top 25%, set in the pack's title font |
| `note`     | none                     | 93%             | Solid pack colour, a short block of large text from 12% down, max width 80% |
| `back`     | none                     | none            | Centred zine title, date range, and a tiny "made with pocket press" line |

**Shared rules for every layout:**

- **Photo frames:** rounded corners at 3% of panel width. Photos fill the frame (cover-fit), and the user can pan and zoom them.
- **Caption row:** three items spread across the frame width with `justify-content: space-between`: [02], location, date (DD.MM.YY). The caption font is set at about 7pt on A6 and scales with the panel size.
- **Page numbers:** the [NN] number comes from the page index, so it updates when pages are reordered.
- **Layout picker:** in the editor, it offers `land_top`, `land_low`, `portrait` and `full` for pages 2 to 6. Pages 1, 7 and 8 have fixed layouts in the MVP.

### Type packs

Each pack is one loud title font, one quiet caption font, and the colours they were made for. All of these fonts are on Google Fonts under the SIL Open Font License, so they can be embedded in the PDF.

| Pack        | Title font                  | Caption font      | Background | Text    | Category    |
| ----------- | --------------------------- | ----------------- | ---------- | ------- | ----------- |
| Postcard    | Imperial Script             | Space Mono 700    | #E9A99C    | #1E1A17 | Script      |
| Park day    | Shrikhand (rotated −5°)     | Space Grotesk 700 | #59B4E6    | #1E1A17 | Display     |
| Market      | Bagel Fat One               | Space Grotesk 700 | #F6D836    | #1E1A17 | Display     |
| Field diary | Archivo Black               | Space Mono 700    | #5A3214    | #A8D4F0 | Display     |
| Note to self| Archivo Black               | Space Grotesk 700 | #F2B33D    | #1E1A17 | Display     |
| Film lab    | Instrument Serif Italic     | Space Mono 700    | #141414    | #F2EBDD | Serif       |
| Postmark    | Syne 800                    | Space Grotesk 700 | #B4552F    | #1E1A17 | Display     |
| Scribble    | Gochi Hand                  | Space Mono 700    | #FFFFFF    | #1E1A17 | Handwritten |
| Gazette     | Bricolage Grotesque 800     | Space Mono 700    | #8E9BD3    | #1E1A17 | Display     |

**How the pack colours are used:**

- Cover, note and back pages: use the pack background as their fill.
- Photo pages: stay white by default, which is the zine look, and can be switched to the pack colour with the page colour swatch.

**Pack data:** store packs as JSON in `/data/typePacks.json` matching the `TypePack` type, so adding a pack means adding a row and no code changes.

**"Mix your own":**

- Title fonts: any of the title fonts above.
- Caption fonts: Space Mono, Space Grotesk or Geist Mono.
- Readability check: before saving, warn if the title font would render below 14pt on the cover at A7 size.

## Visual design system

The app's interface should disappear so the zines carry all the colour. That means pure white or pure black, one neutral grey ramp, and nothing beige or warm-toned. The theme follows the system light or dark setting by default, and a toggle can override it.

### Colour tokens

| Token       | Light   | Dark    | Used for |
| ----------- | ------- | ------- | -------- |
| `--bg`      | #FFFFFF | #000000 | Page background |
| `--fg`      | #0A0A0A | #F5F5F5 | Text, selected borders |
| `--muted`   | #6E6E73 | #A1A1A6 | Secondary text, labels |
| `--line`    | #E8E8E8 | #262626 | Hairline borders, dividers |
| `--surface` | #F5F5F5 | #111111 | Segmented controls, panels, empty states |
| `--inv-bg`  | #0A0A0A | #F5F5F5 | Primary buttons |
| `--inv-fg`  | #FFFFFF | #000000 | Primary button text |
| `--accent`  | #FF4D2E | #FF4D2E | Cut line only, plus destructive states |

Use CSS variables on `:root` with `[data-theme="dark"]` and a `prefers-color-scheme: dark` fallback when the theme is "system". With Tailwind, map these to theme colours (`bg-bg`, `text-fg` and so on). Don't use Tailwind's default palette anywhere in the interface.

### Type

- **Interface font:** Geist 400/500/600, with tight tracking on headings (−0.02em to −0.035em).
- **Mono:** Geist Mono for labels, step numbers ("01 Fold") and counts.
- **Scale:** H1 52px/1.04, H2 22px, body 15 to 18px, labels 13px.
- **Zine fonts:** these appear only inside zine previews and pages, never in the interface itself.

### Components

- **Buttons:** pill shaped (`border-radius: 999px`), 40px tall. The primary button uses the inv colours. The secondary button is a 1px `--line` border with no fill.
- **Cards:** 12px radius with a 1px `--line` border. No drop shadows. Selected cards get a 1.5px `--fg` border.
- **Segmented controls:** a `--surface` track with an inv-coloured active pill.
- **Motion:** keep it minimal. Use 150ms ease-out on hover and selection, and a single page-turn animation in the "Preview fold" view.
- **Spacing:** a 4px base, generous whitespace, and a max content width of 1200px.

### Accessibility

- **Contrast:** all interface text meets WCAG AA on both themes. The muted tokens above pass on their own backgrounds.
- **Keyboard and screen readers:** every control is reachable by keyboard. Format and look cards are radio groups. Toggles use `role="switch"`.
- **Alt text:** photo thumbnails use the caption location and date as alt text, which falls back to "Photo, page N".
- **Colour isn't the only signal:** the selected state never relies on colour alone, because the border weight changes too.

## Tech stack, PDF export and photo metadata

### Suggested stack

- **Framework:** Next.js (App Router) + React + TypeScript. It deploys to Vercel in one step, and the one server route (geocoding) has somewhere to live.
- **Styling:** Tailwind, mapped to the tokens in the design system section.
- **State:** Zustand for the open zine, which saves itself to IndexedDB.
- **Storage:** Dexie (an IndexedDB wrapper) for zines and photo blobs. No backend database in the MVP.
- **Drag and drop:** dnd-kit, for photo-to-page drops and page reordering.
- **PDF:** pdf-lib + @pdf-lib/fontkit.
- **Photo metadata:** exifr.
- **iPhone photos:** heic-to (or heic2any), to convert HEIC uploads in browsers other than Safari.

### PDF export

- **Draw the PDF natively:** draw each page into the PDF with pdf-lib, using the same layout percentages as the editor. Don't screenshot the DOM, because the text would come out blurry.
- **Sheet size:** A3 = 1190.55 × 841.89pt and A4 = 841.89 × 595.28pt, both landscape.
- **Fonts:** bundle the TTF files for every pack in `/public/fonts` and embed them with fontkit. Subset the fonts to keep the file small.
- **Photos:** before embedding, resize each photo to its frame size at 300dpi (an A6 frame is about 1240px wide) and encode it as JPEG at quality 0.88. This keeps an 8-page A3 PDF under about 8MB.
- **Rotation:** apply it per panel using the `IMPOSITION_8` table.
- Run it in a Web Worker so the interface doesn't freeze, and show a progress state on the button.
- **File name:** `{zine-title}-{paper}-print.pdf`.

### Photo metadata and auto captions

1. When a photo is added, read `DateTimeOriginal` and GPS with exifr. This works for JPEG and HEIC.
2. Turn the GPS into a place with a reverse-geocoding call through a Next.js route (`/api/place?lat=&lng=`).
   - Nominatim (OpenStreetMap) is free but limited to 1 request per second.
   - BigDataCloud's free reverse-geocode endpoint is the other option.
   - Cache results by coordinates rounded to 3 decimal places.
3. Format the place as neighbourhood, city (e.g. "Minh An, Hoi An"). Fall back to just the city, then to an empty field the user fills in.
4. Format the date as DD.MM.YY.
5. **Camera roll grouping:** group photos by place, and by date if there's no place. That's the segmented control in the editor.

### Known risk: missing location data

Some phones and browsers strip GPS from photos picked through a web upload. iOS in particular can remove location unless the user allows it. Design for that:

- **Missing place or date:** the caption fields stay editable and empty, and nothing breaks.
- **Upload notice:** show a one-time tip on the upload screen: "No locations? On iPhone, tap Options and turn on Location when picking photos."
- **Fallback grouping:** group by date when there's no place.

## Build order, checks and the Claude Code prompt

### Build order

Work in this order. Each step should be usable before the next one starts.

1. **Imposition + PDF first.** Build a page that takes 8 hard-coded placeholder pages and downloads an A3 PDF. Print it, fold it, and check it. If the fold is wrong, nothing else matters.
2. **The Page renderer and layouts.** Render all seven layouts with placeholder photos, both in the browser and in the PDF, so they match.
3. **Type packs.** Load the packs from JSON, embed the fonts in the PDF, and add the pack switcher.
4. **Editor.** Add photo upload, the camera roll, drag onto pages, the layout picker, page colour, inline caption editing, and page reordering.
5. **Auto captions.** Add EXIF reading, the geocoding route, caching, and the fallbacks.
6. **Start screen and Print screen.** Add the format and look pickers, the summary bar, the sheet preview, paper options, and the fold steps.
7. **Theme and polish.** Add the light/dark tokens, the theme toggle, keyboard access, empty states, and the "print at 100%" callout.

### Acceptance checks

- **The paper test:** print the PDF from step 1 on A4 at 100%, cut it on the line, and fold it. Pages read 1 to 8 in order and none are upside down.
- **Layouts match:** a page looks the same in the editor, the thumbnails, the sheet preview and the PDF, measured side by side.
- **Fonts:** every font in every pack is embedded in the PDF. Check this by opening it on a machine that doesn't have the fonts installed.
- **Missing GPS:** a photo without GPS still drops in cleanly, with editable empty caption fields.
- **HEIC:** a HEIC photo from an iPhone works in Chrome.
- **Export speed:** exporting an 8-page A3 zine with 6 photos takes under 10 seconds on a mid-range laptop, and the file is under 10MB.
- **Themes:** both themes pass WCAG AA contrast. The theme follows the system setting, and the toggle overrides it.
- **Saved work:** reloading the browser keeps the zine, its photos and its settings.

### Before you start

- **Export this brief:** export this doc as Markdown and save it as `BRIEF.md` at the root of an empty project folder.
- **Screenshots:** take screenshots of the four Pocket Press concept screens (Start, Editor, Type packs, Print) and put them in `/reference`.
- **Fonts:** download the TTF files for the fonts in the type pack table from Google Fonts into `/public/fonts`. Claude Code can also do this for you.

### Prompt to paste into Claude Code

> Read BRIEF.md in full, then look at the screenshots in /reference. These are the spec and the visual direction for Pocket Press, a web app that turns camera-roll photos into a print-ready 8-page mini zine.
>
> Build it with Next.js (App Router), React, TypeScript and Tailwind, following the build order in BRIEF.md exactly. Stop after step 1 (imposition + PDF) and tell me how to run it, so I can print and fold a test sheet before you go further. Don't move on to step 2 until I confirm the fold works.
>
> Rules:
> - The imposition table, paper sizes and layout percentages in BRIEF.md are exact. Don't change them without asking.
> - One shared Page renderer drives the editor, thumbnails, sheet preview and PDF.
> - Draw the PDF natively with pdf-lib + fontkit. Don't screenshot the DOM.
> - Use the colour tokens from BRIEF.md for all interface colours. No default Tailwind palette, no beige or warm greys.
> - Everything is stored in the browser (IndexedDB via Dexie). No accounts, no backend database.
> - Keep type packs and layouts as JSON data so I can add more without code changes.
>
> After each step, give me a short summary of what changed, how to test it, and anything you weren't sure about.
