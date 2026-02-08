"""
Fetch jobs from free public remote job APIs.

Sources:
  - Remotive (remotive.com) — free API, remote-only jobs
  - Himalayas (himalayas.app) — free API, remote jobs with location metadata
  - RemoteOK (remoteok.com) — free JSON feed of remote jobs
"""

import logging
import time
from datetime import datetime, timezone

import requests

logger = logging.getLogger(__name__)

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "TamiCloudJobsBoard/1.0"})

REQUEST_TIMEOUT = 30


def _safe_get(url, **kwargs):
    """GET with retries and error handling."""
    for attempt in range(3):
        try:
            resp = SESSION.get(url, timeout=REQUEST_TIMEOUT, **kwargs)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as exc:
            logger.warning("Attempt %d failed for %s: %s", attempt + 1, url, exc)
            if attempt < 2:
                time.sleep(2 ** attempt)
    logger.error("All attempts failed for %s", url)
    return None


# ---------------------------------------------------------------------------
# Remotive
# ---------------------------------------------------------------------------

REMOTIVE_URL = "https://remotive.com/api/remote-jobs"

# Remotive category slugs relevant to marketing/content/community
REMOTIVE_CATEGORIES = [
    "marketing",
    "writing",
    "customer-support",  # often includes community roles
]


def fetch_remotive():
    """Fetch marketing-adjacent jobs from Remotive."""
    jobs = []
    for category in REMOTIVE_CATEGORIES:
        data = _safe_get(REMOTIVE_URL, params={"category": category, "limit": 100})
        if not data or "jobs" not in data:
            continue
        for item in data["jobs"]:
            jobs.append({
                "source": "Remotive",
                "title": item.get("title", ""),
                "company": item.get("company_name", ""),
                "url": item.get("url", ""),
                "location": item.get("candidate_required_location", "Anywhere"),
                "tags": [t.strip() for t in (item.get("tags") or [])],
                "category": item.get("category", ""),
                "description": item.get("description", ""),
                "published": item.get("publication_date", ""),
                "salary": item.get("salary", ""),
            })
    logger.info("Remotive returned %d jobs", len(jobs))
    return jobs


# ---------------------------------------------------------------------------
# Himalayas
# ---------------------------------------------------------------------------

HIMALAYAS_URL = "https://himalayas.app/jobs/api"

HIMALAYAS_CATEGORIES = [
    "marketing",
    "writing",
    "community",
    "communications",
    "content",
]


def fetch_himalayas():
    """Fetch marketing-adjacent jobs from Himalayas."""
    jobs = []
    for category in HIMALAYAS_CATEGORIES:
        data = _safe_get(HIMALAYAS_URL, params={"category": category, "limit": 100})
        if not data or "jobs" not in data:
            continue
        for item in data["jobs"]:
            jobs.append({
                "source": "Himalayas",
                "title": item.get("title", ""),
                "company": item.get("companyName", ""),
                "url": f"https://himalayas.app/jobs/{item['id']}" if item.get("id") else "",
                "location": item.get("location", "Anywhere"),
                "tags": item.get("categories", []),
                "category": category,
                "description": item.get("description", ""),
                "published": item.get("pubDate", ""),
                "salary": item.get("salary", ""),
            })
    logger.info("Himalayas returned %d jobs", len(jobs))
    return jobs


# ---------------------------------------------------------------------------
# RemoteOK
# ---------------------------------------------------------------------------

REMOTEOK_URL = "https://remoteok.com/api"


def fetch_remoteok():
    """Fetch jobs from RemoteOK JSON feed."""
    data = _safe_get(REMOTEOK_URL)
    if not data:
        return []

    jobs = []
    # First element is metadata, skip it
    for item in data[1:] if len(data) > 1 else []:
        jobs.append({
            "source": "RemoteOK",
            "title": item.get("position", ""),
            "company": item.get("company", ""),
            "url": item.get("url", ""),
            "location": item.get("location", "Anywhere"),
            "tags": item.get("tags", []),
            "category": "",
            "description": item.get("description", ""),
            "published": item.get("date", ""),
            "salary": _remoteok_salary(item),
        })
    logger.info("RemoteOK returned %d jobs", len(jobs))
    return jobs


def _remoteok_salary(item):
    sal_min = item.get("salary_min")
    sal_max = item.get("salary_max")
    if sal_min and sal_max:
        return f"${sal_min:,} – ${sal_max:,}"
    if sal_min:
        return f"From ${sal_min:,}"
    if sal_max:
        return f"Up to ${sal_max:,}"
    return ""


# ---------------------------------------------------------------------------
# Aggregate
# ---------------------------------------------------------------------------

def fetch_all():
    """Fetch from all sources and return combined list."""
    all_jobs = []
    for fetcher in [fetch_remotive, fetch_himalayas, fetch_remoteok]:
        try:
            all_jobs.extend(fetcher())
        except Exception:
            logger.exception("Error in %s", fetcher.__name__)
    logger.info("Total raw jobs fetched: %d", len(all_jobs))
    return all_jobs
