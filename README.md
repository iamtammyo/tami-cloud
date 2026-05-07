# Lensed

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
