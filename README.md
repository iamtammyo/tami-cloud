# Tami Cloud — Remote Marketing Jobs Board

Automated jobs board that aggregates truly remote, globally open roles in marketing, content, communication, and community.

## Criteria

Every job listed here passes three filters:

1. **Truly remote** — the company accepts applicants outside its HQ location
2. **Global applicants** — not restricted to a single country or region
3. **Marketing-adjacent** — roles in marketing, content, communication, community, social media, DevRel, and related fields

## Sources

Jobs are fetched daily from free public APIs:

- [Remotive](https://remotive.com)
- [Himalayas](https://himalayas.app)
- [RemoteOK](https://remoteok.com)

## How it works

```
scraper/sources.py   → Fetches jobs from each API
scraper/filters.py   → Applies the three criteria above
scraper/run.py       → Orchestrates fetch → filter → save to data/jobs.json
sitegen/build.py     → Generates a static HTML page from the JSON
```

A GitHub Actions workflow runs daily at 08:00 UTC, updates the data, rebuilds the site, and deploys to GitHub Pages.

## Run locally

```bash
pip install -r requirements.txt
make all    # or: python -m scraper.run && python -m sitegen.build
```

The site is generated at `sitegen/public/index.html`.
