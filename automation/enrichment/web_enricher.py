"""
Web enrichment module.

Visits business websites to extract additional data:
- Email addresses
- Social media links
- Description / about text
- Basic website quality assessment
"""

import re
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

from automation.config import SCRAPER_DELAY_SECONDS


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

EMAIL_REGEX = re.compile(
    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
)

SOCIAL_DOMAINS = {
    "facebook.com": "facebook",
    "instagram.com": "instagram",
    "twitter.com": "twitter",
    "x.com": "twitter",
    "linkedin.com": "linkedin",
    "tiktok.com": "tiktok",
    "youtube.com": "youtube",
}


def _fetch_page(url: str, timeout: int = 10) -> BeautifulSoup | None:
    """Fetch and parse a web page. Returns None on failure."""
    if not url:
        return None
    if not url.startswith("http"):
        url = "https://" + url
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        if resp.status_code != 200:
            return None
        return BeautifulSoup(resp.text, "lxml")
    except requests.RequestException:
        return None


def extract_emails(soup: BeautifulSoup) -> list[str]:
    """Extract email addresses from page HTML."""
    text = soup.get_text()
    emails = EMAIL_REGEX.findall(text)

    # Also check mailto: links
    for a in soup.select("a[href^='mailto:']"):
        href = a.get("href", "")
        email = href.replace("mailto:", "").split("?")[0].strip()
        if email and EMAIL_REGEX.match(email):
            emails.append(email)

    # Deduplicate and filter out common false positives
    seen = set()
    filtered = []
    for email in emails:
        email_lower = email.lower()
        if email_lower in seen:
            continue
        # Skip image file extensions and common non-email patterns
        if any(email_lower.endswith(ext) for ext in [".png", ".jpg", ".gif", ".svg", ".webp"]):
            continue
        seen.add(email_lower)
        filtered.append(email)

    return filtered


def extract_social_media(soup: BeautifulSoup) -> dict[str, str]:
    """Extract social media links from page."""
    socials = {}
    for a in soup.select("a[href]"):
        href = a.get("href", "")
        for domain, platform in SOCIAL_DOMAINS.items():
            if domain in href and platform not in socials:
                socials[platform] = href
    return socials


def extract_description(soup: BeautifulSoup) -> str:
    """Extract business description from meta tags or page content."""
    # Try meta description
    meta = soup.select_one('meta[name="description"]')
    if meta and meta.get("content"):
        return meta["content"].strip()

    # Try OG description
    og = soup.select_one('meta[property="og:description"]')
    if og and og.get("content"):
        return og["content"].strip()

    # Fallback: first meaningful paragraph
    for p in soup.select("p"):
        text = p.get_text(strip=True)
        if len(text) > 50:
            return text[:300]

    return ""


def assess_website_quality(url: str) -> dict:
    """
    Basic website quality assessment.
    Returns dict with has_ssl, is_responsive (viewport meta), has_modern_tech.
    """
    result = {
        "has_ssl": False,
        "is_responsive": False,
        "has_modern_tech": False,
        "quality_score": "low",
    }

    if not url:
        return result

    if not url.startswith("http"):
        url = "https://" + url

    result["has_ssl"] = url.startswith("https://")

    soup = _fetch_page(url)
    if not soup:
        return result

    # Check viewport meta (responsive design)
    viewport = soup.select_one('meta[name="viewport"]')
    if viewport:
        result["is_responsive"] = True

    # Check for modern frameworks / tech indicators
    html = str(soup)
    modern_indicators = [
        "react", "next", "vue", "angular", "tailwind",
        "bootstrap", "webpack", "vite",
    ]
    for indicator in modern_indicators:
        if indicator in html.lower():
            result["has_modern_tech"] = True
            break

    # Score
    score = sum([result["has_ssl"], result["is_responsive"], result["has_modern_tech"]])
    result["quality_score"] = {0: "low", 1: "low", 2: "medium", 3: "high"}[score]

    return result


def enrich_lead(lead: dict) -> dict:
    """
    Enrich a single lead with data from their website.

    Modifies lead dict in-place and returns it.
    """
    url = lead.get("strona_www", "")
    if not url:
        return lead

    print(f"  [Enrichment] Visiting {url}...")
    soup = _fetch_page(url)
    if not soup:
        print(f"  [Enrichment] Could not fetch {url}")
        return lead

    # Extract email if not already present
    if not lead.get("email"):
        emails = extract_emails(soup)
        if emails:
            lead["email"] = emails[0]

    # Extract social media
    socials = extract_social_media(soup)
    if socials:
        lead["notatki"] = lead.get("notatki", "")
        social_str = ", ".join(f"{k}: {v}" for k, v in socials.items())
        if lead["notatki"]:
            lead["notatki"] += f" | Social: {social_str}"
        else:
            lead["notatki"] = f"Social: {social_str}"

    # Website quality
    quality = assess_website_quality(url)
    if quality["quality_score"] == "high":
        lead["notatki"] = lead.get("notatki", "") + " | UWAGA: strona wygląda na profesjonalną"

    time.sleep(SCRAPER_DELAY_SECONDS)
    return lead


def enrich_leads(leads: list[dict]) -> list[dict]:
    """Enrich a list of leads with website data."""
    print(f"[Enrichment] Enriching {len(leads)} leads...")
    for i, lead in enumerate(leads):
        print(f"[Enrichment] {i + 1}/{len(leads)}: {lead.get('nazwa_firmy', '?')}")
        enrich_lead(lead)
    print(f"[Enrichment] Done. Enriched {len(leads)} leads.")
    return leads
