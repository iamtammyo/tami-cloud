#!/usr/bin/env python3
"""
Generate a static HTML newsletter dashboard from data/jobs.json.

Features:
  - Jobs grouped by day
  - Checkboxes to mark jobs as "used in newsletter" (persisted in localStorage)
  - Filter bar (search + show/hide used)
  - "Copy selected" button that copies checked jobs as formatted text
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
  <title>Remote Marketing Jobs — Newsletter Dashboard</title>
  <style>
    :root {
      --bg: #fafaf9;
      --card-bg: #ffffff;
      --text: #1c1917;
      --text-muted: #78716c;
      --accent: #7c3aed;
      --accent-hover: #6d28d9;
      --accent-light: #ede9fe;
      --border: #e7e5e4;
      --tag-bg: #f5f3ff;
      --tag-text: #6d28d9;
      --used-bg: #f0fdf4;
      --used-border: #86efac;
      --green: #16a34a;
      --green-light: #dcfce7;
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
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }

    /* --- Header --- */
    header {
      text-align: center;
      margin-bottom: 2rem;
    }

    header h1 {
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    header p {
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    /* --- Stats bar --- */
    .stats {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .stat {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.6rem 1.2rem;
      text-align: center;
      min-width: 120px;
    }

    .stat-number {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--accent);
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* --- Toolbar --- */
    .toolbar {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .toolbar input[type="text"] {
      flex: 1;
      min-width: 200px;
      padding: 0.6rem 1rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .toolbar input[type="text"]:focus {
      border-color: var(--accent);
    }

    .toolbar-btn {
      padding: 0.6rem 1rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--card-bg);
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .toolbar-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
    }

    .toolbar-btn.active {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    .btn-copy {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
      font-weight: 600;
    }

    .btn-copy:hover {
      background: var(--accent-hover);
    }

    .btn-copy.copied {
      background: var(--green);
      border-color: var(--green);
    }

    /* --- Day groups --- */
    .day-group {
      margin-bottom: 2rem;
    }

    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      margin-bottom: 0.75rem;
      border-bottom: 2px solid var(--accent);
    }

    .day-header h2 {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--accent);
    }

    .day-count {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    /* --- Job cards --- */
    .job-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1rem 1.25rem;
      margin-bottom: 0.6rem;
      transition: all 0.2s;
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .job-card:hover {
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }

    .job-card.used {
      background: var(--used-bg);
      border-color: var(--used-border);
      opacity: 0.75;
    }

    .job-card.used .job-title a {
      text-decoration: line-through;
      color: var(--text-muted);
    }

    /* Checkbox */
    .job-check {
      flex-shrink: 0;
      margin-top: 0.15rem;
    }

    .job-check input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--green);
      cursor: pointer;
    }

    .job-body {
      flex: 1;
      min-width: 0;
    }

    .job-top {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 0.5rem;
    }

    .job-title {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.15rem;
    }

    .job-title a {
      color: var(--text);
      text-decoration: none;
    }

    .job-title a:hover {
      color: var(--accent);
    }

    .job-company {
      color: var(--accent);
      font-weight: 500;
      font-size: 0.9rem;
    }

    .job-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      margin-top: 0.35rem;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .job-summary {
      margin-top: 0.35rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .job-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      margin-top: 0.35rem;
    }

    .tag {
      background: var(--tag-bg);
      color: var(--tag-text);
      font-size: 0.7rem;
      padding: 0.1rem 0.45rem;
      border-radius: 4px;
      font-weight: 500;
    }

    .source-badge {
      background: var(--accent-light);
      color: var(--accent);
      font-size: 0.65rem;
      padding: 0.1rem 0.4rem;
      border-radius: 3px;
      font-weight: 600;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .used-badge {
      background: var(--green-light);
      color: var(--green);
      font-size: 0.65rem;
      padding: 0.1rem 0.4rem;
      border-radius: 3px;
      font-weight: 600;
      text-transform: uppercase;
    }

    /* --- Toast --- */
    .toast {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: var(--text);
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 0.9rem;
      opacity: 0;
      transition: all 0.3s ease;
      z-index: 100;
    }

    .toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    /* --- No results --- */
    .no-results {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
    }

    /* --- Footer --- */
    footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    @media (max-width: 600px) {
      .container { padding: 1rem; }
      header h1 { font-size: 1.4rem; }
      .job-card { padding: 0.75rem; }
      .stats { gap: 0.75rem; }
      .stat { min-width: 90px; padding: 0.5rem 0.75rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Remote Marketing Jobs</h1>
      <p>Newsletter dashboard — check off jobs as you feature them</p>
    </header>

    <div class="stats">
      <div class="stat">
        <div class="stat-number" id="stat-total">{{ total_jobs }}</div>
        <div class="stat-label">Total Jobs</div>
      </div>
      <div class="stat">
        <div class="stat-number" id="stat-new" style="color: var(--accent);">0</div>
        <div class="stat-label">Unused</div>
      </div>
      <div class="stat">
        <div class="stat-number" id="stat-used" style="color: var(--green);">0</div>
        <div class="stat-label">Used</div>
      </div>
      <div class="stat">
        <div class="stat-number" id="stat-days">{{ day_count }}</div>
        <div class="stat-label">Days</div>
      </div>
    </div>

    <div class="toolbar">
      <input type="text" id="search" placeholder="Filter by title, company, or tag..." autocomplete="off">
      <button class="toolbar-btn" id="btn-hide-used">Hide used</button>
      <button class="toolbar-btn" id="btn-unused-only">Unused only</button>
      <button class="toolbar-btn btn-copy" id="btn-copy">Copy selected</button>
    </div>

    <div id="day-groups">
      {% for day in days %}
      <div class="day-group" data-day="{{ day.date }}">
        <div class="day-header">
          <h2>{{ day.display }}</h2>
          <span class="day-count"><span class="day-job-count">{{ day.jobs|length }}</span> jobs</span>
        </div>
        {% for job in day.jobs %}
        <div class="job-card"
             data-id="{{ job.id }}"
             data-search="{{ job.title|lower }} {{ job.company|lower }} {{ job.tags|join(' ')|lower }} {{ job.category|lower }}">
          <div class="job-check">
            <input type="checkbox" title="Mark as used in newsletter" data-job-id="{{ job.id }}">
          </div>
          <div class="job-body">
            <div class="job-top">
              <div>
                <div class="job-title"><a href="{{ job.url }}" target="_blank" rel="noopener">{{ job.title }}</a></div>
                <span class="job-company">{{ job.company }}</span>
              </div>
              <div style="display:flex;gap:0.3rem;align-items:center;">
                <span class="used-badge" style="display:none;">USED</span>
                <span class="source-badge">{{ job.source }}</span>
              </div>
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
        </div>
        {% endfor %}
      </div>
      {% endfor %}
    </div>

    <div class="no-results" id="no-results" style="display:none;">
      No jobs match your current filters.
    </div>

    <footer>
      <p>Updated {{ last_updated_display }}. Sources: Remotive, Himalayas, RemoteOK.</p>
      <p>Showing jobs from Feb 1, 2026 onward. Checkbox state saved in your browser.</p>
    </footer>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    // --- State ---
    const STORAGE_KEY = 'tami-jobs-used';
    let usedJobs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    let hideUsed = false;
    let unusedOnly = false;

    // --- DOM refs ---
    const cards = document.querySelectorAll('.job-card');
    const checkboxes = document.querySelectorAll('.job-check input[type="checkbox"]');
    const searchInput = document.getElementById('search');
    const btnHideUsed = document.getElementById('btn-hide-used');
    const btnUnusedOnly = document.getElementById('btn-unused-only');
    const btnCopy = document.getElementById('btn-copy');
    const noResults = document.getElementById('no-results');
    const toast = document.getElementById('toast');

    // --- Init: restore checkbox state ---
    function restoreState() {
      cards.forEach(card => {
        const id = card.dataset.id;
        const cb = card.querySelector('input[type="checkbox"]');
        const usedBadge = card.querySelector('.used-badge');
        if (usedJobs[id]) {
          cb.checked = true;
          card.classList.add('used');
          usedBadge.style.display = '';
        }
      });
      updateStats();
    }

    // --- Save state ---
    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usedJobs));
    }

    // --- Stats ---
    function updateStats() {
      const total = cards.length;
      const used = Object.keys(usedJobs).length;
      document.getElementById('stat-total').textContent = total;
      document.getElementById('stat-used').textContent = used;
      document.getElementById('stat-new').textContent = total - used;
    }

    // --- Checkbox toggle ---
    checkboxes.forEach(cb => {
      cb.addEventListener('change', function() {
        const id = this.dataset.jobId;
        const card = this.closest('.job-card');
        const usedBadge = card.querySelector('.used-badge');
        if (this.checked) {
          usedJobs[id] = new Date().toISOString();
          card.classList.add('used');
          usedBadge.style.display = '';
        } else {
          delete usedJobs[id];
          card.classList.remove('used');
          usedBadge.style.display = 'none';
        }
        saveState();
        updateStats();
        applyFilters();
      });
    });

    // --- Search + filter ---
    function applyFilters() {
      const q = searchInput.value.toLowerCase().trim();
      let visibleCount = 0;

      document.querySelectorAll('.day-group').forEach(group => {
        let dayVisible = 0;
        group.querySelectorAll('.job-card').forEach(card => {
          const id = card.dataset.id;
          const isUsed = !!usedJobs[id];
          const matchesSearch = !q || card.dataset.search.includes(q);
          const matchesFilter = (!hideUsed || !isUsed) && (!unusedOnly || !isUsed);
          const show = matchesSearch && matchesFilter;
          card.style.display = show ? '' : 'none';
          if (show) { dayVisible++; visibleCount++; }
        });
        // Hide entire day header if no visible jobs
        group.style.display = dayVisible === 0 ? 'none' : '';
        group.querySelector('.day-job-count').textContent = dayVisible;
      });

      noResults.style.display = visibleCount === 0 ? '' : 'none';
    }

    searchInput.addEventListener('input', applyFilters);

    btnHideUsed.addEventListener('click', function() {
      hideUsed = !hideUsed;
      unusedOnly = false;
      this.classList.toggle('active', hideUsed);
      btnUnusedOnly.classList.remove('active');
      applyFilters();
    });

    btnUnusedOnly.addEventListener('click', function() {
      unusedOnly = !unusedOnly;
      hideUsed = false;
      this.classList.toggle('active', unusedOnly);
      btnHideUsed.classList.remove('active');
      applyFilters();
    });

    // --- Copy selected jobs ---
    btnCopy.addEventListener('click', function() {
      const selected = [];
      cards.forEach(card => {
        const id = card.dataset.id;
        if (usedJobs[id]) {
          const title = card.querySelector('.job-title a').textContent.trim();
          const company = card.querySelector('.job-company').textContent.trim();
          const url = card.querySelector('.job-title a').href;
          const location = card.querySelector('.job-meta span').textContent.trim();
          selected.push({ title, company, url, location });
        }
      });

      if (selected.length === 0) {
        showToast('No jobs checked off yet');
        return;
      }

      // Format for newsletter
      let text = 'REMOTE MARKETING JOBS\\n';
      text += '='.repeat(30) + '\\n\\n';
      selected.forEach((job, i) => {
        text += (i + 1) + '. ' + job.title + '\\n';
        text += '   ' + job.company + ' | ' + job.location + '\\n';
        text += '   ' + job.url + '\\n\\n';
      });

      navigator.clipboard.writeText(text).then(() => {
        this.classList.add('copied');
        this.textContent = 'Copied ' + selected.length + ' jobs!';
        showToast('Copied ' + selected.length + ' jobs to clipboard');
        setTimeout(() => {
          this.classList.remove('copied');
          this.textContent = 'Copy selected';
        }, 2000);
      }).catch(() => {
        // Fallback: open in a textarea for manual copy
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Copied ' + selected.length + ' jobs to clipboard');
      });
    });

    // --- Toast ---
    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // --- Boot ---
    restoreState();
  </script>
</body>
</html>
""")


def _group_by_day(jobs):
    """Group jobs by published date, returning a list of day dicts."""
    from collections import OrderedDict
    import re

    days = OrderedDict()
    for job in jobs:
        pub = job.get("published", "")
        # Extract YYYY-MM-DD
        m = re.match(r"(\d{4}-\d{2}-\d{2})", pub)
        date_key = m.group(1) if m else "Unknown"
        days.setdefault(date_key, []).append(job)

    result = []
    for date_key, day_jobs in days.items():
        if date_key == "Unknown":
            display = "Date unknown"
        else:
            try:
                dt = datetime.strptime(date_key, "%Y-%m-%d")
                display = dt.strftime("%A, %B %-d, %Y")
            except ValueError:
                display = date_key
        result.append({
            "date": date_key,
            "display": display,
            "jobs": day_jobs,
        })
    return result


def build():
    """Read jobs JSON and render HTML dashboard."""
    if not DATA_FILE.exists():
        print("No data/jobs.json found. Run the scraper first.")
        return

    data = json.loads(DATA_FILE.read_text())
    jobs = data.get("jobs", [])
    last_updated = data.get("last_updated", "")

    try:
        dt = datetime.fromisoformat(last_updated)
        last_updated_display = dt.strftime("%b %d, %Y at %H:%M UTC")
    except (ValueError, TypeError):
        last_updated_display = last_updated

    days = _group_by_day(jobs)

    html = TEMPLATE.render(
        jobs=jobs,
        days=days,
        day_count=len(days),
        total_jobs=len(jobs),
        last_updated_display=last_updated_display,
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / "index.html"
    output_path.write_text(html)
    print(f"Built dashboard with {len(jobs)} jobs across {len(days)} days -> {output_path}")


if __name__ == "__main__":
    build()
