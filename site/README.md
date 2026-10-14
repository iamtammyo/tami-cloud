# Tami Oladipo: personal site

Astro build of the "Figma to ReadyMag" redesign boards (see `design/`). Five page types: Home, Photography (plus one page per series), Partner with me (live media kit), Case study (one per partnership), and About and contact.

This folder is separate from Lensed (the Next.js app at the repo root). On Vercel, set **Root Directory** to `site`.

## Run it

```bash
cd site
npm install
npm run dev        # http://localhost:4321
```

`npm run build` builds into `dist/`, `npm run check` type-checks, and `npm run contrast` checks every colour pair for WCAG AA.

## Where to edit

| What | File |
| --- | --- |
| Email, social links, writing URL, media kit PDF, form endpoints | `src/data/site.ts` |
| Home copy, cards, brand logos | `src/data/home.ts` |
| Your portrait on Home | drop it at `src/assets/portrait.jpg` (it's picked up automatically) |
| Photography headline and statement | `src/data/photography.ts` |
| Photo series (one file each) | `src/content/photo-series/*.yaml` |
| Media kit numbers, audience, rates, process | `src/data/partnerships.ts` |
| Case studies (one file each) | `src/content/case-studies/*.yaml` |
| About copy and contact topics | `src/data/about.ts` |
| Colours, fonts, sizes | `src/styles/tokens.css` |

Headlines mark the script accent word with underscores: `Two videos, one _guardrail_`.

Images: put files in `src/assets/` and reference them from YAML with a relative path (for example `image: ../../assets/lekki/01.jpg`), plus `alt`. With no image set, the labelled placeholder from the design shows instead.

Photo series `status`: `public` builds; `draft` and `held` never build (`held` is for work under exhibition anonymity rules).

## Still to fill in

Everything in `[square brackets]` on the pages, plus the `TODO`s in `src/data/site.ts`:

- Public email
- Social profile URLs (LinkedIn, Instagram, Threads, TikTok)
- Writing portfolio URL
- Media kit PDF (put it in `public/` and set `mediaKitPdf: '/media-kit.pdf'`)
- Contact form endpoint (Formspree, Basin or similar). Until then the form opens the visitor's email app, once an email is set.
- Newsletter form action from your newsletter platform
