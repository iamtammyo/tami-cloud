# tami-cloud

Two apps live here:

- **Lensed** (`/`) — a workbench for amateur photographers.
- **The Digital Garden** (`/garden`) — a personal digital garden: half-formed notes planted in public, linked by theme rather than time, and tended as they grow.

## The Digital Garden (`/garden`)

A note-keeping space built on the digital-gardening ethos (Bernstein's *Hypertext Gardens*, Caufield's *The Garden and the Stream*, Maggie Appleton's six patterns), dressed as a dreamy literary magazine — parchment, garamond serifs, small caps, drop caps, fig-ink accents.

- **Plantings** — notes with a growth stage (✧ seedling · ❀ budding · ❦ evergreen), planted/tended dates, and topics ("beds").
- **Wiki links** — `[[Title]]` links between notes; every note shows backlinks ("paths that lead here"); links to unplanted notes offer to plant them.
- **Topography over timelines** — the index groups by topic, never by date; a *wander* button opens a random planting.
- **Ownership** — everything lives in `localStorage`; *take cuttings* exports the whole garden as Markdown or JSON.
- Ships with seed notes that double as documentation of the concept and the app.

# Lensed (`/`)

A workbench for amateur photographers. Three tabs:

- **My Photos** — upload your work and get a written critique from Claude (composition, lighting, technique, strengths, things to try next time).
- **Inspiration** — browse a curated set of well-known photographers, grouped by style, name, or era. Filter by genre or search by name/country/keyword.
- **Stats** — aggregates everything you've uploaded to surface what you gravitate toward (top genres, recurring moods, common subjects, color palette tendencies, recurring growth themes) and suggests photographers worth studying based on your patterns.

## Stack

Next.js 14 (App Router) · React · Tailwind · Anthropic SDK (Claude vision).

## Setup

```bash
npm install
cp .env.local.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

## How analysis works

Uploaded images are scaled in the browser (long edge ≤ 1568px) and sent as base64 to `/api/analyze`. The route calls Claude with a JSON-only critic prompt. Results are stored in `localStorage` so the **Stats** tab can build a profile over time. Nothing leaves your machine except the image bytes the analysis call needs.

## Inspiration data

`app/lib/photographers.ts` is a curated dataset (Ansel Adams, Vivian Maier, Henri Cartier-Bresson, Saul Leiter, Daido Moriyama, Fan Ho, William Eggleston, etc.). Sample tiles are seeded `picsum.photos` placeholders — swap in real curated work where licensing permits.

## Notes

- Requires `ANTHROPIC_API_KEY` server-side for the analyze route.
- Stats need ~10 uploads before patterns become meaningful; the UI flags thin samples.
