#!/usr/bin/env python3
"""
Generate a static HTML jobs board from data/jobs.json.
"""

import json
from datetime import datetime, timezone
from pathlib import Path

from jinja2 import Template

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "data" / "jobs.json"
OUTPUT_DIR = ROOT / "sitegen" / "public"

TEMPLATE = Template("""\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Remote Marketing Jobs — Global, Truly Remote</title>
  <style>
    :root {
      --bg: #fafaf9;
      --card-bg: #ffffff;
      --text: #1c1917;
      --text-muted: #78716c;
      --accent: #7c3aed;
      --accent-light: #ede9fe;
      --border: #e7e5e4;
      --tag-bg: #f5f3ff;
      --tag-text: #6d28d9;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                   "Helvetica Neue", Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }

    .container {
      max-width: 860px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }

    header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    header h1 {
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    header p {
      color: var(--text-muted);
      font-size: 1rem;
    }

    .meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .search-bar {
      margin-bottom: 1.5rem;
    }

    .search-bar input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-bar input:focus {
      border-color: var(--accent);
    }

    .job-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .job-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1.25rem 1.5rem;
      transition: box-shadow 0.2s;
    }

    .job-card:hover {
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }

    .job-card h2 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .job-card h2 a {
      color: var(--text);
      text-decoration: none;
    }

    .job-card h2 a:hover {
      color: var(--accent);
    }

    .job-company {
      color: var(--accent);
      font-weight: 500;
      font-size: 0.95rem;
    }

    .job-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .job-summary {
      margin-top: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-muted);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .job-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: 0.5rem;
    }

    .tag {
      background: var(--tag-bg);
      color: var(--tag-text);
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
    }

    .source-badge {
      background: var(--accent-light);
      color: var(--accent);
      font-size: 0.7rem;
      padding: 0.1rem 0.4rem;
      border-radius: 3px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .no-results {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
    }

    footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    @media (max-width: 600px) {
      .container { padding: 1rem; }
      header h1 { font-size: 1.4rem; }
      .job-card { padding: 1rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Remote Marketing Jobs</h1>
      <p>Truly remote roles in content, communication &amp; community. Updated daily.</p>
    </header>

    <div class="meta">
      <span>{{ total_jobs }} jobs found</span>
      <span>Updated {{ last_updated_display }}</span>
    </div>

    <div class="search-bar">
      <input type="text" id="search" placeholder="Filter by title, company, or tag..." autocomplete="off">
    </div>

    <div class="job-list" id="job-list">
      {% for job in jobs %}
      <div class="job-card" data-search="{{ job.title|lower }} {{ job.company|lower }} {{ job.tags|join(' ')|lower }} {{ job.category|lower }}">
        <div style="display:flex;justify-content:space-between;align-items:start;">
          <div>
            <h2><a href="{{ job.url }}" target="_blank" rel="noopener">{{ job.title }}</a></h2>
            <span class="job-company">{{ job.company }}</span>
          </div>
          <span class="source-badge">{{ job.source }}</span>
        </div>
        <div class="job-meta">
          <span>{{ job.location or 'Anywhere' }}</span>
          {% if job.salary %}<span>{{ job.salary }}</span>{% endif %}
        </div>
        {% if job.summary %}
        <p class="job-summary">{{ job.summary }}</p>
        {% endif %}
        {% if job.tags %}
        <div class="job-tags">
          {% for tag in job.tags[:5] %}
          <span class="tag">{{ tag }}</span>
          {% endfor %}
        </div>
        {% endif %}
      </div>
      {% endfor %}
    </div>

    <div class="no-results" id="no-results" style="display:none;">
      No jobs match your search.
    </div>

    <footer>
      <p>Curated by Tami Cloud. Jobs sourced from Remotive, Himalayas &amp; RemoteOK.</p>
      <p>Filtered for truly remote, globally open, marketing-adjacent roles.</p>
    </footer>
  </div>

  <script>
    const search = document.getElementById('search');
    const list = document.getElementById('job-list');
    const cards = list.querySelectorAll('.job-card');
    const noResults = document.getElementById('no-results');

    search.addEventListener('input', function() {
      const q = this.value.toLowerCase().trim();
      let visible = 0;
      cards.forEach(card => {
        const match = !q || card.dataset.search.includes(q);
        card.style.display = match ? '' : 'none';
        if (match) visible++;
      });
      noResults.style.display = visible === 0 ? '' : 'none';
    });
  </script>
</body>
</html>
""")


def build():
    """Read jobs JSON and render HTML."""
    if not DATA_FILE.exists():
        print("No data/jobs.json found. Run the scraper first.")
        return

    data = json.loads(DATA_FILE.read_text())
    jobs = data.get("jobs", [])
    last_updated = data.get("last_updated", "")

    # Format the update timestamp for display
    try:
        dt = datetime.fromisoformat(last_updated)
        last_updated_display = dt.strftime("%b %d, %Y at %H:%M UTC")
    except (ValueError, TypeError):
        last_updated_display = last_updated

    html = TEMPLATE.render(
        jobs=jobs,
        total_jobs=len(jobs),
        last_updated_display=last_updated_display,
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / "index.html"
    output_path.write_text(html)
    print(f"Built site with {len(jobs)} jobs → {output_path}")


if __name__ == "__main__":
    build()
