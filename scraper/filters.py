"""
Filter jobs to match Tami's criteria:

1. Truly remote — accepts applicants outside company HQ
2. Global applicants — not restricted to a single country/region
3. Marketing-focused or adjacent — content, communication, community
"""

import re
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 1. Role relevance — marketing / content / communication / community
# ---------------------------------------------------------------------------

# Keywords that signal the role is in the right domain
ROLE_KEYWORDS = [
    # Marketing
    "marketing",
    "growth",
    "brand",
    "demand gen",
    "demand generation",
    "go-to-market",
    "gtm",
    "digital marketing",
    "performance marketing",
    "product marketing",
    "email marketing",
    "lifecycle",
    "acquisition",
    "retention",
    "seo",
    "sem",
    "paid media",
    "paid social",
    "marketing manager",
    "marketing lead",
    "marketing director",
    "vp marketing",
    "head of marketing",
    "cmo",
    # Content
    "content",
    "copywriter",
    "copywriting",
    "content writer",
    "content strategist",
    "content manager",
    "content marketing",
    "editorial",
    "editor",
    "blog",
    "technical writer",
    "content lead",
    "content director",
    "storytelling",
    # Communication
    "communications",
    "communication",
    "comms",
    "public relations",
    "pr manager",
    "pr specialist",
    "media relations",
    "internal comms",
    "corporate communications",
    "press",
    # Community
    "community",
    "community manager",
    "community lead",
    "community director",
    "developer relations",
    "devrel",
    "developer advocate",
    "developer evangelist",
    "advocacy",
    "community engagement",
    "community builder",
    "community coordinator",
    # Social media
    "social media",
    "social media manager",
    "social media strategist",
    # Events
    "events",
    "event marketing",
    "event manager",
    # Partnerships that overlap with marketing
    "partner marketing",
    "influencer",
    "creator",
    "ambassador",
]

# Compile patterns once for performance
_ROLE_PATTERNS = [re.compile(r"\b" + re.escape(kw) + r"\b", re.IGNORECASE) for kw in ROLE_KEYWORDS]

# Roles that look like matches but aren't — engineering, design, etc.
EXCLUDE_KEYWORDS = [
    "software engineer",
    "backend engineer",
    "frontend engineer",
    "full stack",
    "fullstack",
    "data engineer",
    "devops",
    "sre",
    "machine learning",
    "ml engineer",
    "infrastructure",
    "platform engineer",
    "security engineer",
    "qa engineer",
    "test engineer",
    "ios developer",
    "android developer",
    "ux designer",
    "ui designer",
    "product designer",
    "graphic designer",
    "accountant",
    "bookkeeper",
    "finance manager",
    "tax",
    "legal counsel",
    "attorney",
    "lawyer",
    "paralegal",
]

_EXCLUDE_PATTERNS = [re.compile(r"\b" + re.escape(kw) + r"\b", re.IGNORECASE) for kw in EXCLUDE_KEYWORDS]


def _is_relevant_role(job):
    """Check if title/tags/category indicate a marketing-adjacent role."""
    text = " ".join([
        job.get("title", ""),
        job.get("category", ""),
        " ".join(job.get("tags", [])),
    ])
    # Reject if title is clearly a non-marketing role
    title = job.get("title", "")
    for pat in _EXCLUDE_PATTERNS:
        if pat.search(title):
            return False
    # Accept if any marketing keyword matches
    for pat in _ROLE_PATTERNS:
        if pat.search(text):
            return True
    return False


# ---------------------------------------------------------------------------
# 2 & 3. Truly remote + global applicants
# ---------------------------------------------------------------------------

# Location strings that indicate geographic restriction (NOT global)
RESTRICTED_LOCATIONS = [
    # US-only patterns
    r"\bus[\s-]*only\b",
    r"\bunited states only\b",
    r"\bmust be (based |located )?in the (us|united states|u\.s\.)\b",
    # Specific country restrictions
    r"\b(uk|canada|eu|europe|australia|germany|france) only\b",
    r"\bmust be (based |located )?in\b",
    # Timezone as a soft restriction can sometimes mean region-locked
    # but we allow timezone preferences — only block hard restrictions
]

_RESTRICTED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in RESTRICTED_LOCATIONS]

# Location strings that strongly signal global/anywhere acceptance
GLOBAL_SIGNALS = [
    "anywhere",
    "worldwide",
    "global",
    "remote",
    "earth",
    "all countries",
    "international",
]

_GLOBAL_PATTERNS = [re.compile(r"\b" + re.escape(s) + r"\b", re.IGNORECASE) for s in GLOBAL_SIGNALS]


def _is_global_remote(job):
    """
    Determine if the job is truly remote and open to global applicants.

    Strategy:
    - If the location field contains a hard restriction, reject.
    - If the location field contains a global signal, accept.
    - If location is empty/vague and the source is remote-only (Remotive,
      RemoteOK), lean towards accepting — these platforms list remote jobs.
    - Check the description for restriction phrases as a secondary filter.
    """
    location = job.get("location", "").strip()
    description = job.get("description", "")

    # Check for hard geographic restrictions in location field
    for pat in _RESTRICTED_PATTERNS:
        if pat.search(location):
            return False

    # Check for global signals in location
    for pat in _GLOBAL_PATTERNS:
        if pat.search(location):
            return True

    # If location is empty or just whitespace, check description
    if not location or location.lower() in ("", "remote"):
        # Check description for restrictions
        desc_lower = description[:2000].lower()  # first 2000 chars
        for phrase in ["us only", "united states only", "must be based in",
                       "must be located in", "must reside in"]:
            if phrase in desc_lower:
                return False
        # Remote-focused sources default to global if no restriction found
        if job.get("source") in ("Remotive", "RemoteOK", "Himalayas"):
            return True

    # If location lists specific countries/regions but no "only" qualifier,
    # it might still be open. Accept if it lists multiple regions.
    if "," in location or "/" in location:
        return True

    # Single location with no global signal — could be restricted
    # Be conservative: reject if it looks like a single country/city
    if location and not any(p.search(location) for p in _GLOBAL_PATTERNS):
        return False

    return True


# ---------------------------------------------------------------------------
# Combined filter
# ---------------------------------------------------------------------------

def filter_jobs(jobs):
    """Apply all filters and return only matching jobs."""
    filtered = []
    for job in jobs:
        if not _is_relevant_role(job):
            continue
        if not _is_global_remote(job):
            continue
        filtered.append(job)
    logger.info("Filtered %d → %d jobs", len(jobs), len(filtered))
    return filtered
