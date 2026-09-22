# tami.cloud

Tami Oladipo's personal site, arranged like a desktop. Folders hold files. Opening a folder opens a window. Adding a section to the site means adding a folder; adding a piece of work means adding a file.

Built with Next.js 14 (App Router), React, Tailwind, and TypeScript. Deploys to Vercel.

## Run it

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000.

## How the site is organised

```
content/
  site.ts              name, handle, city, motto, wallpaper, sticky note
  desktop.ts           the folder registry (order here = order on the desktop)
  folders/*.ts         one file per folder, each a list of files
app/
  (desktop)/           the desktop shell: menubar, icons, windows
  components/desktop/  Menubar, Window, GetInfo, views, MediaKit, icons
  api/stats/           media kit numbers from Buffer, cached hourly
  apps/lensed/         Lensed, the photo critique app, kept as a desktop app
public/wallpaper.svg   placeholder wallpaper; swap for your own photo
```

### Folders on the desktop

| Folder | Label | What goes in it |
| --- | --- | --- |
| Read me | ABOUT | Who you are, in a few notes |
| Camera roll | PHOTOGRAPHY | Photos with camera, lens, settings, location |
| Showing my work | WRITING | Published writing, each file links out |
| On record | SOCIAL | Social profiles and embedded posts |
| Work with me | MEDIA KIT | Live channel stats, rates, past deals |
| Field notes | GARDEN | Notes that link to each other, drawn as a map |
| Trash | ABANDONED | Ideas you started and stopped |

### Add a folder

1. Create `content/folders/my-folder.ts` exporting a `Folder` (see `content/types.ts`).
2. Import it in `content/desktop.ts` and add it to the `folders` array.

Views available: `list`, `grid` (photos), `garden` (notes with a connections map), `mediakit`.

### Add a file

Append a `DesktopFile` to the folder's `files` array. Every file gets a URL at `/<folder>/<file>` and a Get Info panel built from its fields.

- Photos: set `image` and `photo` (camera, lens, settings, location). Put real files in `public/photos/` and point `image.src` at them.
- Published writing: set `publisher` and `url`.
- Social embeds: set `url`, and `embedUrl` for an iframe (Instagram post URL + `embed/`, or LinkedIn's "Embed this post" URL).
- Garden notes: set `links` to other note slugs to draw the connections.

## Media kit stats

`/api/stats` calls Buffer's GraphQL API for aggregated post metrics over the last 30 days (reach, reactions, comments, shares, post count), overall and per channel. Cached for an hour.

Set these in `.env.local` (and in Vercel):

```
BUFFER_ACCESS_TOKEN=...       # https://publish.buffer.com/settings/api
BUFFER_ORGANIZATION_ID=...    # the "Tami's Socials" organization
```

Without a token the page shows a labelled snapshot. Buffer's API doesn't expose follower totals, so the `followers` field on each channel in `content/folders/work-with-me.ts` is kept by hand. Rates live in the same file.

## Lensed

The photo critique app lives at `/apps/lensed` and needs `ANTHROPIC_API_KEY`. Its own README notes are in `app/apps/lensed/`.
