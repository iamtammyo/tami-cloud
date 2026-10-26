# Visual direction: the mix for v1

There are two families in these references:

- **The colour zines** (01–03: Manila, Lisbon, Amsterdam): loud pack-colour covers, a big title in a script or fat display font, one photo in a rounded frame with a thin dark outline. Inside: full-bleed photos, photo grids on pack colour, and big chatty text pages.
- **The white zine** (04–05: HCMC): white pages, one photo each, a tiny mono caption row (`[01]  Location, VN    09.04.26`), full-bleed pages with captions top and bottom, one shouty uppercase note page, one solid-colour cover.

**The mix:** colour on the outside, white on the inside. Covers, the note page and the back use the colour-zine look. Photo pages use the white-zine look. That's already how the brief uses pack colours, so most of this is in the brief already. The references mainly tell us how to finish it.

## What we take, what we skip

| From the references | v1? | Why |
| --- | --- | --- |
| Pack-colour cover, big title, rounded photo frame (01–03) | Yes | This is the `cover` layout. It's the hero of the whole product. |
| Thin dark outline around photo frames on coloured pages (01–03) | Yes | One stroke. Cheap, and it's what makes these look printed rather than templated. |
| White photo pages with a mono caption row (04–05) | Yes | `land_top`, `land_low`, `portrait` |
| Full bleed with captions top and bottom (05) | Yes | `full` |
| Shouty uppercase text page in pack colour (04, yellow) | Yes | `note` |
| Solid colour back with the title in the script font (03, red) | Yes | `back` |
| Three photos stacked on one page (04, bottom left) | **Proposed** | A new `trio` layout. Cheap to draw, but the editor needs a page to hold more than one photo. |
| Five mixed-size photos in a grid (03, pink page) | Later | Mixed aspect ratios and choosing which photo goes where get fiddly. `trio` gets most of the effect. |
| Text wrapping around small photos (02, Vondelpark) | Later | The best page in the set, but flowing text around images is the most complicated thing here. A good v2 headline feature. |

## Proposed v1 layout set

These are the seven layouts from the brief plus `trio`. Changes marked **needs OK** alter numbers the brief says are exact.

| Layout | Frame (x, y, w, h) | Caption | Change |
| --- | --- | --- | --- |
| `cover` | 5%, 23%, 90%, 70% | none | **needs OK**: bigger photo, smaller title band, no caption, matching Amsterdam/Lisbon. Brief: 7%, 30%, 86%, 58% with a caption at 93%. |
| `land_top` | 7%, 10%, 86%, 44% | 56% | as brief |
| `land_low` | 7%, 38%, 86%, 44% | 84% | as brief |
| `portrait` | 7%, 10%, 86%, 76% | 88% | as brief |
| `full` | 0, 0, 100%, 100% | 3.5% and 94% | as brief |
| `note` | none | 93% | as brief. The default text is set uppercase in the title font (HCMC yellow page). |
| `back` | none | none | as brief |
| `trio` | three frames: 7%, 8% / 37% / 66%, 86% wide, 26% tall | none | **needs OK**: new layout, offered for pages 2–6 |

Shared finishing rules (also need OK, they're additive):

- **Outline:** 0.75pt stroke in the pack's text colour around photo frames, but only when the page has a coloured background. White pages stay clean, like HCMC.
- **Caption row:** `[02]` and the location grouped on the left, the date on the right, as in 05. The brief currently spreads all three items across the width.
- **Default page order:** if `trio` goes in, it replaces the second `land_top` on page 6, so a new zine shows every layout family.

## Type pack notes

- Manila → Market (Bagel Fat One on yellow), Lisbon → Postcard (Imperial Script on pink), HCMC note page → Note to self (Archivo Black on orange-yellow). These line up well.
- **Amsterdam's cover is a slanted brush script.** Park day uses Shrikhand, a chunky display font, on the same blue. It won't read like the reference. Suggestion: switch Park day to a brush script like Yellowtail (Google Fonts, Apache 2.0, fine to embed in PDFs). **needs OK**

## The files

- `01-covers-manila-lisbon-amsterdam.jpg`: three covers side by side
- `02-amsterdam-cover-and-spread.jpg`: cover, plus full-bleed and text-wrap spread
- `03-lisbon-cover-and-grid-spread.jpg`: cover, plus grid and full-bleed spread, red back
- `04-hcmc-print-sheets.webp`: two imposed sheets (front and back of a bigger zine)
- `05-hcmc-layout-templates.png`: four white-page layout templates with caption rows
