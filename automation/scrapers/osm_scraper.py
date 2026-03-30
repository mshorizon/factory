"""
OpenStreetMap Overpass API scraper for Polish businesses.

Uses the free Overpass API to find businesses by category and city.
No API key required, no cost.
"""

import time
import overpy
from dataclasses import dataclass, asdict
from typing import Optional


# OSM tag mappings for common business categories
CATEGORY_TAGS = {
    "restauracja": {"amenity": "restaurant"},
    "kawiarnia": {"amenity": "cafe"},
    "bar": {"amenity": "bar"},
    "pub": {"amenity": "pub"},
    "fast_food": {"amenity": "fast_food"},
    "fryzjer": {"shop": "hairdresser"},
    "kosmetyczka": {"shop": "beauty"},
    "mechanik": {"shop": "car_repair"},
    "dentysta": {"amenity": "dentist"},
    "lekarz": {"amenity": "doctors"},
    "apteka": {"amenity": "pharmacy"},
    "kwiaciarnia": {"shop": "florist"},
    "piekarnia": {"shop": "bakery"},
    "sklep_spozywczy": {"shop": "convenience"},
    "siłownia": {"leisure": "fitness_centre"},
    "hotel": {"tourism": "hotel"},
    "weterynarz": {"amenity": "veterinary"},
    "optyk": {"shop": "optician"},
    "fotograf": {"shop": "photo"},
    "pralnia": {"shop": "laundry"},
    "elektryk": {"craft": "electrician"},
    "hydraulik": {"craft": "plumber"},
    "stolarz": {"craft": "carpenter"},
    "malarz": {"craft": "painter"},
    "dekarz": {"craft": "roofer"},
    "ślusarz": {"craft": "locksmith"},
}

# Major Polish cities with approximate bounding boxes (south, west, north, east)
CITY_BBOX = {
    "Kraków": (49.97, 19.79, 50.13, 20.12),
    "Warszawa": (52.10, 20.85, 52.37, 21.17),
    "Wrocław": (51.05, 16.87, 51.18, 17.13),
    "Poznań": (52.33, 16.82, 52.47, 17.02),
    "Gdańsk": (54.30, 18.52, 54.42, 18.73),
    "Łódź": (51.68, 19.37, 51.83, 19.57),
    "Katowice": (50.22, 18.92, 50.30, 19.07),
    "Lublin": (51.19, 22.47, 51.30, 22.62),
    "Szczecin": (53.38, 14.48, 53.47, 14.62),
    "Bydgoszcz": (53.08, 17.93, 53.17, 18.13),
}


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


def _build_query(category: str, city: str) -> str:
    """Build Overpass QL query for a given category and city."""
    if category not in CATEGORY_TAGS:
        raise ValueError(
            f"Unknown category '{category}'. Available: {list(CATEGORY_TAGS.keys())}"
        )
    if city not in CITY_BBOX:
        raise ValueError(
            f"Unknown city '{city}'. Available: {list(CITY_BBOX.keys())}"
        )

    tag_key, tag_value = next(iter(CATEGORY_TAGS[category].items()))
    south, west, north, east = CITY_BBOX[city]

    query = f"""
    [out:json][timeout:60];
    (
      node["{tag_key}"="{tag_value}"]({south},{west},{north},{east});
      way["{tag_key}"="{tag_value}"]({south},{west},{north},{east});
    );
    out center tags;
    """
    return query


def _parse_tags(tags: dict, category: str, city: str) -> Optional[BusinessLead]:
    """Parse OSM tags into a BusinessLead. Returns None if no name."""
    name = tags.get("name")
    if not name:
        return None

    # Build address from available tags
    street = tags.get("addr:street", "")
    housenumber = tags.get("addr:housenumber", "")
    postcode = tags.get("addr:postcode", "")
    addr_city = tags.get("addr:city", city)

    address_parts = []
    if street:
        addr_str = street
        if housenumber:
            addr_str += f" {housenumber}"
        address_parts.append(addr_str)
    if postcode:
        address_parts.append(postcode)
    if addr_city:
        address_parts.append(addr_city)

    address = ", ".join(address_parts)

    # Opening hours
    opening_hours = tags.get("opening_hours", "")

    return BusinessLead(
        nazwa_firmy=name,
        adres=address,
        miasto=city,
        telefon=tags.get("phone", tags.get("contact:phone", "")),
        email=tags.get("email", tags.get("contact:email", "")),
        strona_www=tags.get("website", tags.get("contact:website", "")),
        branza=category,
        ocena="",
        liczba_opinii="",
        godziny_otwarcia=opening_hours,
        zrodlo="osm",
    )


def scrape_osm(category: str, city: str) -> list[BusinessLead]:
    """
    Scrape businesses from OpenStreetMap via Overpass API.

    Args:
        category: Business category key (e.g. "restauracja", "fryzjer")
        city: Polish city name (e.g. "Kraków", "Warszawa")

    Returns:
        List of BusinessLead objects
    """
    api = overpy.Overpass()
    query = _build_query(category, city)

    print(f"[OSM] Searching for '{category}' in {city}...")

    try:
        result = api.query(query)
    except overpy.exception.OverpassTooManyRequests:
        print("[OSM] Rate limited, waiting 30s...")
        time.sleep(30)
        result = api.query(query)

    leads = []

    # Process nodes
    for node in result.nodes:
        lead = _parse_tags(node.tags, category, city)
        if lead:
            leads.append(lead)

    # Process ways (some businesses are mapped as areas)
    for way in result.ways:
        lead = _parse_tags(way.tags, category, city)
        if lead:
            leads.append(lead)

    print(f"[OSM] Found {len(leads)} businesses for '{category}' in {city}")
    return leads


if __name__ == "__main__":
    # Quick test
    results = scrape_osm("restauracja", "Kraków")
    for r in results[:5]:
        print(f"  {r.nazwa_firmy} | {r.adres} | {r.telefon} | {r.strona_www}")
