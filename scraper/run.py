#!/usr/bin/env python3
"""
Main entry point: fetch jobs, filter, deduplicate, save to JSON.

Jobs are accumulated across runs — new jobs get merged into the existing
data file so the board grows over time. Only jobs published on or after
DATE_CUTOFF are kept.
"""

import json
import hashlib
import logging
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from scraper.sources import fetch_all
from scraper.filters import filter_jobs

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# Only keep jobs published on or after this date
DATE_CUTOFF = "2026-02-01"


def _job_id(job):
    """Create a stable ID for deduplication."""
    key = f"{job.get('title', '')}|{job.get('company', '')}|{job.get('url', '')}"
    return hashlib.md5(key.encode()).hexdigest()


def _strip_html(text):
    """Remove HTML tags from description for cleaner display."""
    clean = re.sub(r"<[^>]+>", " ", text)
    clean = re.sub(r"\s+", " ", clean)
    return clean.strip()[:500]


def _parse_date(date_str):
    """Try to extract a YYYY-MM-DD from various date formats."""
    if not date_str:
        return None
    # ISO format: 2026-02-05T12:00:00...
    m = re.match(r"(\d{4}-\d{2}-\d{2})", date_str)
    if m:
        return m.group(1)
    return None


def _is_after_cutoff(job):
    """Return True if the job was published on or after DATE_CUTOFF."""
    pub = _parse_date(job.get("published", ""))
    if pub:
        return pub >= DATE_CUTOFF
    # If no parseable date, keep it (it's fresh from the API)
    return True


def deduplicate(jobs):
    """Remove duplicate listings (same title + company + url)."""
    seen = set()
    unique = []
    for job in jobs:
        jid = _job_id(job)
        if jid not in seen:
            seen.add(jid)
            unique.append(job)
    logger.info("Deduplicated %d → %d jobs", len(jobs), len(unique))
    return unique


def _load_existing():
    """Load previously saved jobs so we can merge."""
    path = DATA_DIR / "jobs.json"
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text())
        return data.get("jobs", [])
    except (json.JSONDecodeError, KeyError):
        return []


def run():
    """Fetch, filter, deduplicate, merge with existing, and save."""
    logger.info("Starting job fetch...")

    raw_jobs = fetch_all()
    filtered = filter_jobs(raw_jobs)

    # Clean up descriptions for display
    for job in filtered:
        job["id"] = _job_id(job)
        job["summary"] = _strip_html(job.get("description", ""))
        job.pop("description", None)
        job["fetched_at"] = datetime.now(timezone.utc).isoformat()

    # Merge with existing jobs (existing ones keep their data)
    existing = _load_existing()
    existing_ids = {j.get("id") or _job_id(j) for j in existing}
    new_count = 0
    for job in filtered:
        if job["id"] not in existing_ids:
            existing.append(job)
            existing_ids.add(job["id"])
            new_count += 1
    logger.info("Merged: %d new jobs added to %d existing", new_count, len(existing) - new_count)

    # Apply date cutoff
    all_jobs = [j for j in existing if _is_after_cutoff(j)]
    logger.info("After date cutoff (%s): %d jobs", DATE_CUTOFF, len(all_jobs))

    # Deduplicate and sort
    unique = deduplicate(all_jobs)
    unique.sort(key=lambda j: j.get("published", j.get("fetched_at", "")), reverse=True)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    output_path = DATA_DIR / "jobs.json"

    output = {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "total_jobs": len(unique),
        "jobs": unique,
    }

    output_path.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    logger.info("Saved %d jobs to %s", len(unique), output_path)
    return unique


if __name__ == "__main__":
    jobs = run()
    print(f"\n{len(jobs)} jobs saved to data/jobs.json")
    sys.exit(0)
