"""
Panorama Firm (panoramafirm.pl) web scraper.

Scrapes business listings from the Polish business directory.
Free, no API key needed.
"""

import time
import requests
from bs4 import BeautifulSoup
from dataclasses import dataclass, asdict
from typing import Optional
from urllib.parse import quote

from automation.config import SCRAPER_DELAY_SECONDS


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "pl-PL,pl;q=0.9,en;q=0.8",
}

BASE_URL = "https://panoramafirm.pl"


@dataclass
class BusinessLead:
    nazwa_firmy: str
    adres: str
    miasto: str
    telefon: str
    email: str
    strona_www: str
    branza: str
    ocena: str
    liczba_opinii: str
    godziny_otwarcia: str
    zrodlo: str

    def to_dict(self) -> dict:
        return asdict(self)


def _parse_listing(card, category: str, city: str) -> Optional[BusinessLead]:
    """Parse a single business listing card from Panorama Firm."""
    # Business name
    name_el = card.select_one("h2 a, h3 a, .company-name a, .link-name")
    if not name_el:
        return None
    name = name_el.get_text(strip=True)
    if not name:
        return None

    # Address
    address_el = card.select_one(".address, .company-address, [itemprop='address']")
    address = address_el.get_text(strip=True) if address_el else ""

    # Phone
    phone_el = card.select_one(
        ".phone-number, [data-phone], [itemprop='telephone'], .phones"
    )
    phone = ""
    if phone_el:
        phone = phone_el.get("data-phone", "") or phone_el.get_text(strip=True)

    # Website
    website_el = card.select_one("a[data-link-type='website'], a.website-link")
    website = ""
    if website_el:
        website = website_el.get("href", "")

    return BusinessLead(
        nazwa_firmy=name,
        adres=address,
        miasto=city,
        telefon=phone,
        email="",  # emails rarely shown on listing pages
        strona_www=website,
        branza=category,
        ocena="",
        liczba_opinii="",
        godziny_otwarcia="",
        zrodlo="panoramafirm",
    )


def scrape_panorama(category: str, city: str, max_pages: int = 3) -> list[BusinessLead]:
    """
    Scrape businesses from panoramafirm.pl.

    Args:
        category: Search term in Polish (e.g. "restauracja", "fryzjer")
        city: Polish city name (e.g. "krakow", "warszawa") - lowercase, no Polish chars
        max_pages: Maximum number of result pages to scrape

    Returns:
        List of BusinessLead objects
    """
    leads = []
    city_slug = city.lower().replace("ó", "o").replace("ł", "l").replace("ś", "s").replace("ź", "z").replace("ż", "z").replace("ą", "a").replace("ę", "e").replace("ć", "c").replace("ń", "n")

    print(f"[Panorama] Searching for '{category}' in {city}...")

    for page in range(1, max_pages + 1):
        url = f"{BASE_URL}/{quote(category)}/{city_slug}"
        if page > 1:
            url += f"/firmy,{page}.html"

        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            if resp.status_code != 200:
                print(f"[Panorama] Page {page}: HTTP {resp.status_code}, stopping.")
                break

            soup = BeautifulSoup(resp.text, "lxml")

            # Find business listing cards
            cards = soup.select(
                ".company-item, .search-result, .company-box, "
                "[itemtype*='LocalBusiness'], .listing-item"
            )

            if not cards:
                # Try more generic selectors
                cards = soup.select(".row.result, .card.company")

            if not cards:
                print(f"[Panorama] Page {page}: no listings found, stopping.")
                break

            page_leads = 0
            for card in cards:
                lead = _parse_listing(card, category, city)
                if lead:
                    leads.append(lead)
                    page_leads += 1

            print(f"[Panorama] Page {page}: found {page_leads} businesses")

            if page < max_pages:
                time.sleep(SCRAPER_DELAY_SECONDS)

        except requests.RequestException as e:
            print(f"[Panorama] Error on page {page}: {e}")
            break

    print(f"[Panorama] Total: {len(leads)} businesses for '{category}' in {city}")
    return leads


if __name__ == "__main__":
    results = scrape_panorama("restauracja", "Kraków", max_pages=2)
    for r in results[:5]:
        print(f"  {r.nazwa_firmy} | {r.adres} | {r.telefon} | {r.strona_www}")
