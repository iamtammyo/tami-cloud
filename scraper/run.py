#!/usr/bin/env python3
"""
Main entry point: fetch jobs, filter, deduplicate, save to JSON.
"""

import json
import hashlib
import logging
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


def _job_id(job):
    """Create a stable ID for deduplication."""
    key = f"{job.get('title', '')}|{job.get('company', '')}|{job.get('url', '')}"
    return hashlib.md5(key.encode()).hexdigest()


def _strip_html(text):
    """Remove HTML tags from description for cleaner display."""
    import re
    clean = re.sub(r"<[^>]+>", " ", text)
    clean = re.sub(r"\s+", " ", clean)
    return clean.strip()[:500]  # keep first 500 chars as summary


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


def run():
    """Fetch, filter, deduplicate, and save jobs."""
    logger.info("Starting job fetch...")

    raw_jobs = fetch_all()
    filtered = filter_jobs(raw_jobs)
    unique = deduplicate(filtered)

    # Clean up descriptions for display
    for job in unique:
        job["summary"] = _strip_html(job.get("description", ""))
        # Remove full description to keep JSON small
        job.pop("description", None)
        # Add a fetch timestamp
        job["fetched_at"] = datetime.now(timezone.utc).isoformat()

    # Sort by published date (newest first), falling back to fetched_at
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
    print(f"\n✓ {len(jobs)} jobs saved to data/jobs.json")
    sys.exit(0)
