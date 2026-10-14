# Site brief: Tami Oladipo personal website (v2, redesign)

Source of truth for the rebuild. Supersedes v1 (editorial magazine direction, Keystatic-first), which was scrapped on Tami's request. When Tami's instructions conflict with this file, follow Tami and update it.

## Direction

Built from the "tamioladipo.com redesign: Figma to ReadyMag" boards, saved as screenshots in `design/`. Cream paper ground with grain, colour-blocked sections per page, Cormorant Garamond headlines with one script word (Mrs Saint Delafield) per headline, Hanken Grotesk for everything else.

| Page | Route | Colour block |
| --- | --- | --- |
| Home | `/` | Ink portrait panel, periwinkle band |
| Photography | `/photography`, `/photography/[series]` | Terracotta |
| Partner with me (media kit) | `/partnerships` | Wine |
| Case study | `/partnerships/[slug]` | Wine |
| About and contact | `/about` (contact at `/about#contact`) | Periwinkle |

Nav: Photography, Partner with me, About, Writing ↗ (external portfolio).

## Decisions made in the build

- `/partnerships` keeps the old Squarespace URL working.
- Contrast: terracotta changed from `#b4552f` to `#c86a42` (ink text on it was 3.5:1), and periwinkle bands carrying cream script words use `#7887c4` instead of `#8e9bd3` (cream on it was 2.5:1). `npm run contrast` checks every pair.
- Grain is an inline SVG noise texture, so there's no image request.
- Content lives in data files and YAML collections, so a CMS (Keystatic or similar) can sit on top later without restructuring.
- YouTube videos load only on click, through youtube-nocookie.com.
- Admin: Keystatic at `/keystatic`. Every page, photo, series and case study is editable. Local files in dev, GitHub commits in production. The site is static apart from the admin route, which runs on Vercel through `@astrojs/vercel`.
- Photos without alt text fail the build. Links with nowhere to go (writing, media kit, forms) hide themselves.
- Media kit engagement lines come from Buffer (`src/data/buffer-stats.json`). Follower counts stay manual, since Buffer's API doesn't expose them.
- SEO: sitemap.xml, robots.txt (admin disallowed), Person structured data on Home and About, 301 redirects from the old Squarespace URLs.

## Open questions for Tami

- The design file is titled "Figma to ReadyMag". Is the plan to build in ReadyMag instead of code? This build assumes code.
- Domain: tamioladipo.com or tamilore.com.
- Form and newsletter providers.
- Keep the site in this repo next to Lensed, or move it to its own repo.

## Non-negotiables carried over from v1

- WCAG 2.2 AA contrast, alt text on every image, visible focus, one h1 per page, skip link, keyboard-usable everything.
- No layout shift from images; responsive sizes.
- Held or draft photo work never builds.
