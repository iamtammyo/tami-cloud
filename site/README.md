# Tami Oladipo: personal site

Astro build of the "Figma to ReadyMag" redesign (boards in `design/`), with a built-in admin at **`/keystatic`** for editing every page, photo and case study.

This folder is separate from Lensed (the Next.js app at the repo root).

## Editing the site (the admin)

Go to `yoursite.com/keystatic`, sign in with GitHub, edit, press **Save**. Each save is a commit to the repo, and Vercel redeploys in about a minute.

| In the admin | What it controls |
| --- | --- |
| Pages → Home | Portrait, intro, the three cards (and their small photos), brand logos |
| Pages → Photography page | Headline and statement |
| Pages → Partner with me | Media kit: follower counts, audience, rates, usage, process, quote |
| Pages → About and contact | Hero photo, story, what you're working on, form topics |
| Work → Photo series | One entry per series. Status Public shows it; Draft and Held never build |
| Work → Case studies | One entry per brand partnership |
| Site → Site settings | Email, social links, writing portfolio link, media kit PDF, form endpoints |

Rules the site enforces:
- **Alt text:** a photo saved without alt text stops the deploy with a clear message, so the old version stays live until you add it.
- **Script words:** wrap the handwritten accent word in underscores, e.g. `Say _hello_`.
- **Empty links stay hidden:** with no link set, the Writing card and nav link, the media kit buttons and the forms don't show.

## Social numbers from Buffer

`src/data/buffer-stats.json` holds 90-day engagement totals from Buffer ("Tami's Socials"). The media kit turns them into per-post averages for every number set to auto-fill from Buffer in the admin. Buffer's API doesn't expose follower counts, so those stay manual in the admin.

To refresh: pull new totals from Buffer, then update the JSON and its `updatedAt` date. This can run on a monthly schedule; see "Automating the Buffer refresh" in `DEPLOY.md`.

## Run it locally

```bash
cd site
npm install
npm run dev        # site at http://localhost:4321, admin at /keystatic (saves to local files)
```

`npm run build` makes the production build (Vercel output in `.vercel/output`), `npm run check` type-checks, and `npm run contrast` checks every colour pair for WCAG AA.

## Where things live

- `keystatic.config.ts`: the admin's fields
- `src/content.config.ts`: the same fields as the site reads them (keep the two in step)
- `src/content/`: all editable content (YAML), written by the admin
- `src/assets/`: uploaded photos, optimised at build time
- `src/styles/tokens.css`: colours, fonts and sizes

Deploying and connecting the admin to GitHub: see `DEPLOY.md`.
