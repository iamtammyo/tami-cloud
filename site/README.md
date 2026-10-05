# Tami Oladipo: personal site

Astro site for tamioladipo.com / tamilore.com (domain still open). The full spec lives in [BRIEF.md](./BRIEF.md). Read it before changing anything.

This folder is separate from Lensed (the Next.js app at the repo root). On Vercel, set the project's **Root Directory** to `site`.

## Run it

```bash
cd site
npm install
cp .env.example .env   # set SITE_URL
npm run dev            # http://localhost:4321
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serve the build locally |
| `npm run check` | Type and template checks |
| `npm run contrast` | Checks every colour token against the background for WCAG AA |

## Where things live

- `src/styles/tokens.css`: every colour, font, size and space value. Swap brand kit values here, then run `npm run contrast`.
- `src/styles/global.css`: reset, base type, focus states, `.label`, `.em`, `.aside-hand`
- `src/config/site.ts`: name, nav, footer links, socials (moves to Keystatic in phase 2)
- `src/layouts/BaseLayout.astro`: head metadata, skip link, masthead, footer. Pass `variant="quiet"` for photography pages.
- `src/components/`: Masthead, Footer, SectionLabel, Placeholder (temporary)

## Build progress

- [x] Phase 1: foundations
- [ ] Phase 2: Keystatic backend and content schemas
- [ ] Phase 3: pages
- [ ] Phase 4: photography
- [ ] Phase 5: polish
- [ ] Phase 6: launch prep
