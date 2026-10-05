# Site brief: Tami Oladipo personal website

Read this whole file before writing code. It is the source of truth for structure, content model and design. When something here conflicts with a later instruction from Tami, follow Tami and update this file.

## 1. What this site is

One home for everything Tami Oladipo does, built as a designed, editorial site rather than a template.

- Photographer: bodies of work, exhibition history
- Independent creator: The Remote Path, brand partnerships, content across LinkedIn, Instagram, Threads, YouTube and TikTok
- Content lead at Buffer: long-form writing, the State of Social Media Engagement report series, editing, social
- Writer: articles across publications
- Newsletter editor: the newsletters she runs or works on

Primary audiences, in order: hiring managers and collaborators checking her career, brands evaluating a partnership, people discovering her photography, readers of her work.

The homepage must answer "who is this and where do I go" within one screen.

## 2. Open decisions (ask Tami before building anything that depends on these)

- Domain: `tamioladipo.com` or `tamilore.com`. Build domain-agnostic; read the site URL from config.
- Photography section look: shares the main system, or a quieter variant (default: quieter variant).
- Visual references: Tami will supply Pinterest screenshots with notes. Until then, use section 6 as the starting point.
- Hosting: Vercel by default. Check plan terms, since partnership pages make the site partly commercial.
- Repository: the site currently lives in `site/` inside `iamtammyo/tami-cloud`, next to the Lensed app. Decide whether to move it to its own repo before launch.

## 3. Stack

- Framework: Astro (latest stable), static output by default
- Content editor: Keystatic, admin UI at `/keystatic`, GitHub storage mode in production, local mode in development
- Content format: Markdoc for long text, YAML or JSON for structured entries
- Styling: plain CSS with custom properties (design tokens) in one `tokens.css`; no CSS framework unless Tami asks
- Images: Astro's built-in image handling, responsive `srcset`, modern formats, lazy loading below the fold
- Hosting: Vercel, with the Keystatic admin route served server-side
- Repo: one GitHub repository; every content change is a commit

Keep dependencies minimal. Explain any new dependency to Tami in one line before adding it.

## 4. Information architecture and routes

Top nav, exactly five items: About, Work, Photography, Creator, Contact. Partnerships is linked from Creator and the footer, not the main nav.

| Route | Page | Source |
| --- | --- | --- |
| `/` | Home | `home` singleton + featured entries |
| `/about` | About, career timeline, CV download, press | `profile`, `timeline` singletons |
| `/work` | Work overview | featured entries from all work types |
| `/work/buffer` | Buffer role and projects | `bufferProjects`, `articles` where publication = Buffer |
| `/work/writing` | All articles, filter by publication and topic | `articles` |
| `/work/newsletters` | Newsletters | `newsletters` |
| `/work/[slug]` | Case study | `bufferProjects` with `caseStudy: true` |
| `/photography` | Project index | `photoProjects` where status = public |
| `/photography/[slug]` | Photo project | `photoProjects` |
| `/photography/exhibitions` | Exhibitions and open calls | `exhibitions` (hidden from nav until it has an entry) |
| `/creator` | The Remote Path, platforms, featured posts | `creator` singleton, `featuredPosts`, `videos` |
| `/creator/videos` | Videos | `videos` |
| `/partnerships` | For brands: overview, past partnerships | `partnerships`, `mediaKit` |
| `/partnerships/media-kit` | Current media kit | `mediaKit` singleton |
| `/partnerships/[slug]` | One-off brand pitch page | `brandPages` |
| `/contact` | Contact | `settings` |

Rules:
- Hyphenated, lowercase URLs only.
- `brandPages` output `noindex, nofollow`, are excluded from the sitemap, and never appear in listings.
- Photo projects with status `draft` or `held` do not build public pages.
- A section with zero entries hides its nav link or homepage door instead of showing an empty page.

## 5. Content model (Keystatic)

Field types are Keystatic field types. Required fields are marked (req).

### Collections

`articles`
- title (req), slug (req), publication (req, select: Buffer, The Remote Path, Substack, Other), otherPublication (text, shown when Other), url (req, external link), date (req), topics (multi-select, editable list), summary (req, max 200 chars), cover (image, optional, alt req if set), featured (checkbox)

`bufferProjects`
- title (req), slug (req), type (req, select: Report, Series, Campaign, Article, Other), year (req), role (req), summary (req), results (list of short text), url, cover (image + alt), caseStudy (checkbox), body (Markdoc, used when caseStudy is true), featured (checkbox)

`newsletters`
- name (req), slug (req), role (req, e.g. Editor, Writer), platform (req), cadence, description (req), subscribeUrl (req), status (req, select: Active, Past), logo (image + alt), featured (checkbox)

`photoProjects`
- title (req), slug (req), year (req), statement (req, Markdoc), cover (image + alt, req), images (req, array of: image, alt (req), caption, place, year), sequence order follows array order, status (req, select: Draft, Held, Public; default Draft), featured (checkbox)
- `Held` exists for work under exhibition anonymity rules. It must never render publicly.

`exhibitions`
- title (req), organiser (req), year (req), type (select: Group show, Solo show, Award, Publication, Open call), status (select: Selected, Shortlisted, Exhibited, Award), relatedProject (relationship to photoProjects), url

`videos`
- title (req), platform (req, select: YouTube, Instagram, TikTok, LinkedIn, Other), url (req), date (req), thumbnail (image + alt), featured (checkbox)
- YouTube URLs render as a privacy-enhanced embed loaded on click, not on page load.

`featuredPosts`
- platform (req), url (req), image (image + alt), context (req, one line), date

`partnerships`
- brand (req), slug (req), year (req), deliverables (list), results (list of short text), quote (text), quoteAttribution, url, logo (image + alt)

`brandPages`
- brand (req), slug (req), intro (req, Markdoc), ideas (Markdoc), includeMediaKit (checkbox, default true), contactNote, expires (date, optional; after this date the page returns a friendly "this page has expired, get in touch" message)

### Singletons

- `home`: oneLiner (req), introParagraph, heroImage (image + alt, req), doors (array of: label, description, link), showLatest (checkbox)
- `profile`: name, headshot (image + alt), bioShort (50 words), bioLong (Markdoc), photoBio (50 words, third person), cvFile (file)
- `timeline`: entries (array of: start, end, title, organisation, description)
- `creator`: intro (Markdoc), platforms (array of: platform, handle, url)
- `mediaKit`: asOfDate (req), audience (array of: platform, followers, note), demographics (Markdoc), rates note, pdf (file)
- `settings`: siteTitle, email, socials (array of: platform, url), footerNote

Adding a new content type later must only require: a new collection in the Keystatic config, a schema in Astro content config, and one listing component. Keep the code organised so that stays true.

## 6. Design system (starting point)

Direction: an indie magazine you can scroll. Editorial structure, generous space, photography doing the visual work. Derived from Tami's DFE Brand Kit 001. Replace the starting values below with exact kit values when Tami provides them.

Tokens (put all of these in `tokens.css`):

| Token | Role | Starting value | Phase 1 value |
| --- | --- | --- | --- |
| `--color-bg` | Page background | cream / off-white | `#f5f0e6` |
| `--color-text` | Body text | near-black | `#1a1a1a` |
| `--color-accent` | Headline emphasis, links | light blue | `#2e6a97` (see note) |
| `--color-accent-light` | Decorative highlight only | light blue | `#9cc9e8` |
| `--color-accent-muted` | Secondary emphasis | dusty blue | `#56768f` |
| `--color-warm` | Occasional accent | warm brown | `#7a4e30` |
| `--font-display` | Headlines | high-contrast serif | Fraunces |
| `--font-body` | Body text | clean sans | DM Sans |
| `--font-label` | Section labels, nav | the sans, all caps, tracked | DM Sans |
| `--font-accent` | Handwritten aside | handwritten face, max one or two uses per page | Caveat |

Contrast note (phase 1): light blue on cream is about 1.5:1, which fails WCAG AA even for large text. The accent was split: `--color-accent` is a deeper blue that passes for links and text (5.1:1), and the kit's light blue lives on as `--color-accent-light`, used only as a highlight underlay and hover marks. `npm run contrast` re-checks every colour after a kit swap.

Typography and layout rules:
- Headlines in sentence case, never title case.
- Section labels in tracked caps act as wayfinding (for example "PHOTOGRAPHY / 02").
- Body text at a comfortable reading size, line length 60 to 75 characters.
- Images large and uncropped where possible; respect each photo's aspect ratio.
- A clear masthead with Tami's name on every page.
- Photography pages use a quieter variant: more white space, minimal chrome, captions small and below images.

Motion:
- Subtle page transitions and gentle reveal on scroll only.
- Respect `prefers-reduced-motion` everywhere; with it on, no motion at all.

No emoji anywhere in the UI.

## 7. Page specs

Home
- Masthead, then the one-liner and intro paragraph beside or over the hero photograph.
- Four doors from the `home.doors` array, defaulting to: Work at Buffer, Writing and newsletters, Photography, Creator and partnerships.
- "Latest" strip: the three most recent items across articles, photo projects and videos.
- Newsletter signup linking to the active newsletter.

Work
- Overview leads with Buffer, then writing, then newsletters.
- Writing list is filterable by publication and topic without a full page reload, and still works with JavaScript off (all items visible).

Photography project page
- Title, year, statement, then images in array order, then captions.
- Optional full-screen view on click, keyboard navigable, Escape to close.

Partnerships
- Short pitch, past partnerships with results, link to media kit, contact route.
- Media kit shows `asOfDate` prominently so stale numbers are obvious.

## 8. Requirements

Accessibility (non-negotiable)
- WCAG 2.2 AA colour contrast; check accent colours against the cream background and adjust if they fail.
- Every image has alt text; the admin enforces it.
- Full keyboard navigation with visible focus states.
- Semantic headings in order on every page; one `h1` per page.
- Skip-to-content link.

Performance
- Lighthouse 90+ on performance, accessibility, best practices and SEO for Home, a photo project page and Writing.
- No layout shift from images; always set dimensions.

SEO and sharing
- Title, description and Open Graph image per page, with sensible defaults from the entry.
- `sitemap.xml` and `robots.txt`; brand pages and held or draft content excluded.
- Person structured data on Home and About.

Migration
- Redirects from existing Squarespace URLs (`/about`, `/partnerships`, `/blog`, `/contact`, `/portfolio`, `/press`, `/my-work`) to their new equivalents.

## 9. Build phases

Work one phase per session. At the end of each, run the site locally, list what changed, and stop for Tami's review.

1. Foundations: Astro project, tokens, fonts, base layout, masthead, nav, footer, 404 page. **Done.**
2. Backend: Keystatic config with every collection and singleton in section 5, Astro content schemas, seed one sample entry per type.
3. Pages: Home, About, Work and subpages, Creator, Partnerships, media kit, brand page template, Contact.
4. Photography: index, project pages, full-screen view, exhibitions page.
5. Polish: motion, accessibility audit, Lighthouse pass, SEO metadata, redirects.
6. Launch prep: Vercel project, GitHub mode for Keystatic, domain connection steps written out for Tami to follow.

## 10. Out of scope for now

- E-commerce or print sales
- Comments, user accounts, or a blog engine beyond the content types above
- Analytics beyond a privacy-friendly page-view counter, and only if Tami asks
