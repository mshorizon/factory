"""
Business JSON generator for the Factory rendering engine.

Takes scraped lead data and generates a valid BusinessProfile JSON
(based on specialist.json electrician template) + Polish translations.
Creates template folder structure ready for db:seed.
"""

import json
import re
import copy
from pathlib import Path

from automation.config import BASE_DIR


TEMPLATES_DIR = BASE_DIR.parent / "templates"
SPECIALIST_JSON = TEMPLATES_DIR / "specialist" / "specialist.json"
SPECIALIST_PL = TEMPLATES_DIR / "specialist" / "translations" / "pl.json"
SPECIALIST_SETTINGS = TEMPLATES_DIR / "specialist" / "translations" / "_settings.json"


def _slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    text = text.lower().strip()
    replacements = {
        "ą": "a", "ć": "c", "ę": "e", "ł": "l", "ń": "n",
        "ó": "o", "ś": "s", "ź": "z", "ż": "z",
    }
    for pl, en in replacements.items():
        text = text.replace(pl, en)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def _parse_hours_to_booking(hours_str: str) -> dict:
    """
    Parse hours string like 'Pon-Pt: 7:00-18:00, Sob: 8:00-14:00'
    into booking hours format.
    """
    default_hours = {
        "mon": {"enabled": True, "open": "08:00", "close": "17:00"},
        "tue": {"enabled": True, "open": "08:00", "close": "17:00"},
        "wed": {"enabled": True, "open": "08:00", "close": "17:00"},
        "thu": {"enabled": True, "open": "08:00", "close": "17:00"},
        "fri": {"enabled": True, "open": "08:00", "close": "17:00"},
        "sat": {"enabled": False, "open": "09:00", "close": "13:00"},
        "sun": {"enabled": False, "open": "09:00", "close": "13:00"},
    }

    if not hours_str:
        return default_hours

    # Try to parse OSM-style hours: Mo-Fr 09:00-17:00; Sa 10:00-14:00
    day_map = {
        "Mo": "mon", "Tu": "tue", "We": "wed", "Th": "thu",
        "Fr": "fri", "Sa": "sat", "Su": "sun",
        # Polish abbreviations
        "Pon": "mon", "Wt": "tue", "Śr": "wed", "Czw": "thu",
        "Pt": "fri", "Sob": "sat", "Nd": "sun", "Niedz": "sun",
    }

    result = copy.deepcopy(default_hours)

    parts = re.split(r"[;,]", hours_str)
    for part in parts:
        part = part.strip()
        if not part:
            continue

        # Extract time range
        time_match = re.search(r"(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})", part)
        if not time_match:
            continue

        open_time = time_match.group(1)
        close_time = time_match.group(2)

        # Pad hours: 7:00 → 07:00
        if len(open_time) == 4:
            open_time = "0" + open_time
        if len(close_time) == 4:
            close_time = "0" + close_time

        # Extract days
        day_part = part[:time_match.start()].strip().rstrip(":").strip()

        # Check for day range (Mo-Fr, Pon-Pt)
        range_match = re.match(r"(\w+)\s*-\s*(\w+)", day_part)
        if range_match:
            start_day = range_match.group(1)
            end_day = range_match.group(2)

            day_order = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
            start_idx = None
            end_idx = None

            for abbr, code in day_map.items():
                if abbr.lower() == start_day.lower() or abbr == start_day:
                    start_idx = day_order.index(code)
                if abbr.lower() == end_day.lower() or abbr == end_day:
                    end_idx = day_order.index(code)

            if start_idx is not None and end_idx is not None:
                for i in range(start_idx, end_idx + 1):
                    day = day_order[i]
                    result[day] = {"enabled": True, "open": open_time, "close": close_time}
        else:
            # Single day
            for abbr, code in day_map.items():
                if abbr.lower() == day_part.lower() or abbr == day_part:
                    result[code] = {"enabled": True, "open": open_time, "close": close_time}
                    break

    return result


def generate_business_json(lead: dict) -> dict:
    """
    Generate a BusinessProfile JSON from scraped lead data.
    Based on specialist.json electrician template.

    Args:
        lead: Dict with scraped business data (from leads.csv)

    Returns:
        Valid BusinessProfile dict
    """
    # Load specialist template as base
    with open(SPECIALIST_JSON, "r", encoding="utf-8") as f:
        template = json.load(f)

    config = copy.deepcopy(template)

    # Generate unique ID — avoid duplicating city if already in the name
    slug = _slugify(lead.get("nazwa_firmy", "firma"))
    city_slug = _slugify(lead.get("miasto", ""))
    if city_slug and city_slug not in slug:
        subdomain = f"{slug}-{city_slug}"
    else:
        subdomain = slug

    # Truncate if too long
    if len(subdomain) > 50:
        subdomain = subdomain[:50].rstrip("-")

    # Update business info
    config["business"]["id"] = subdomain
    config["business"]["name"] = "t:business.name"
    config["business"]["industry"] = "electrician"

    # Contact
    contact = config["business"]["contact"]
    contact["address"] = lead.get("adres", "")
    contact["phone"] = lead.get("telefon", "")
    # Email must be valid format or omitted (schema validates format: "email")
    email = lead.get("email", "").strip()
    if email and "@" in email:
        contact["email"] = email
    else:
        contact.pop("email", None)
    contact["hours"] = lead.get("godziny_otwarcia", "Pon-Pt: 8:00-17:00")

    # Location — default to city center if no GPS data
    # (we don't have GPS from OSM scraper in CSV, but could be added)
    # Keep template defaults for now

    # Google rating
    if lead.get("ocena"):
        try:
            config["business"]["googleRating"]["score"] = float(lead["ocena"])
        except (ValueError, TypeError):
            pass
    if lead.get("liczba_opinii"):
        try:
            config["business"]["googleRating"]["count"] = int(lead["liczba_opinii"])
        except (ValueError, TypeError):
            pass

    # Socials — from enrichment
    notatki = lead.get("notatki", "")
    if "facebook" in notatki.lower():
        fb_match = re.search(r"facebook:\s*(https?://[^\s,|]+)", notatki)
        if fb_match:
            config["business"]["socials"]["facebook"] = fb_match.group(1)
    if "instagram" in notatki.lower():
        ig_match = re.search(r"instagram:\s*(https?://[^\s,|]+)", notatki)
        if ig_match:
            config["business"]["socials"]["instagram"] = ig_match.group(1)

    # Update booking hours from scraped opening hours
    if lead.get("godziny_otwarcia"):
        config["booking"]["hours"] = _parse_hours_to_booking(lead["godziny_otwarcia"])

    # Update service area based on city
    miasto = lead.get("miasto", "Warszawa")
    service_areas = _generate_service_areas(miasto)
    config["business"]["serviceArea"] = [f"t:serviceArea.areas.{i}" for i in range(len(service_areas))]
    config["sharedSections"]["service-area-main"]["areas"] = [
        f"t:serviceArea.areas.{i}" for i in range(len(service_areas))
    ]

    # Update footer contact info
    if config.get("layout", {}).get("footer", {}).get("columns"):
        footer_links = config["layout"]["footer"]["columns"][0]["links"]
        if len(footer_links) >= 3:
            footer_links[0]["label"] = lead.get("telefon", "")
            footer_links[0]["target"]["value"] = lead.get("telefon", "").replace(" ", "")
            footer_links[1]["label"] = lead.get("email", "kontakt@firma.pl")
            footer_links[1]["target"]["value"] = lead.get("email", "kontakt@firma.pl")
            footer_links[2]["label"] = lead.get("adres", "")

    # Update CTA phone
    if config.get("navigation", {}).get("cta"):
        phone_clean = lead.get("telefon", "").replace(" ", "")
        config["navigation"]["cta"]["target"]["value"] = phone_clean

    return config, subdomain


def _generate_service_areas(city: str) -> list[str]:
    """Generate service area names based on city."""
    area_map = {
        "Kraków": ["Stare Miasto", "Podgórze", "Nowa Huta", "Krowodrza", "Bronowice", "Dębniki", "Prądnik", "Wieliczka"],
        "Warszawa": ["Śródmieście", "Mokotów", "Żoliborz", "Praga", "Ursynów", "Wilanów", "Piaseczno", "Konstancin-Jeziorna"],
        "Wrocław": ["Stare Miasto", "Krzyki", "Fabryczna", "Psie Pole", "Śródmieście", "Biskupin", "Oporów", "Leśnica"],
        "Poznań": ["Stare Miasto", "Jeżyce", "Grunwald", "Nowe Miasto", "Wilda", "Rataje", "Winogrady", "Piątkowo"],
        "Gdańsk": ["Śródmieście", "Wrzeszcz", "Oliwa", "Przymorze", "Zaspa", "Morena", "Sopot", "Gdynia"],
        "Łódź": ["Śródmieście", "Bałuty", "Widzew", "Górna", "Polesie", "Retkinia", "Dąbrowa", "Teofilów"],
        "Katowice": ["Śródmieście", "Brynów", "Ligota", "Bogucice", "Zawodzie", "Dąb", "Sosnowiec", "Chorzów"],
    }
    return area_map.get(city, [city, f"okolice {city}"])


def generate_translations(lead: dict, service_areas: list[str]) -> dict:
    """
    Generate Polish translations for a business.
    Based on specialist translations but with business-specific data.
    """
    # Load specialist PL translations as base
    with open(SPECIALIST_PL, "r", encoding="utf-8") as f:
        base_translations = json.load(f)

    translations = copy.deepcopy(base_translations)

    # Override business-specific translations
    nazwa = lead.get("nazwa_firmy", "Elektryk")
    miasto = lead.get("miasto", "")
    telefon = lead.get("telefon", "")

    translations["business.name"] = nazwa

    # Hero
    translations["hero.badge"] = f"Elektryk {miasto} i okolice"
    translations["hero.title"] = f"Profesjonalne Usługi Elektryczne — {nazwa}"
    translations["hero.subtitle"] = f"Zaufany elektryk w {miasto}. Szybko, bezpiecznie i profesjonalnie."
    if telefon:
        translations["hero.cta"] = telefon

    # Service area
    areas = _generate_service_areas(miasto)
    for i, area in enumerate(areas):
        translations[f"serviceArea.areas.{i}"] = area
    translations["serviceArea.title"] = f"Gdzie Działamy"
    translations["serviceArea.subtitle"] = f"Świadczymy profesjonalne usługi elektryczne w {miasto} i okolicach."

    # Footer
    translations["footer.copyright"] = f"© 2024 {nazwa}. Wszelkie prawa zastrzeżone."
    translations["footer.tagline"] = f"Profesjonalne usługi elektryczne w {miasto}"
    if telefon:
        translations["footer.callExtension.phone"] = telefon

    return translations


def create_template_folder(lead: dict) -> tuple[str, Path]:
    """
    Create a complete template folder for a business ready for db:seed.

    Args:
        lead: Dict with scraped business data

    Returns:
        Tuple of (subdomain, template_folder_path)
    """
    config, subdomain = generate_business_json(lead)
    miasto = lead.get("miasto", "Warszawa")
    service_areas = _generate_service_areas(miasto)
    translations_pl = generate_translations(lead, service_areas)

    # Create folder structure
    template_dir = TEMPLATES_DIR / subdomain
    translations_dir = template_dir / "translations"
    translations_dir.mkdir(parents=True, exist_ok=True)

    # Write business JSON
    config_path = template_dir / f"{subdomain}.json"
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

    # Write translations
    pl_path = translations_dir / "pl.json"
    with open(pl_path, "w", encoding="utf-8") as f:
        json.dump(translations_pl, f, ensure_ascii=False, indent=2)

    # Write settings
    settings = {"primaryLanguage": "pl"}
    settings_path = translations_dir / "_settings.json"
    with open(settings_path, "w", encoding="utf-8") as f:
        json.dump(settings, f, ensure_ascii=False, indent=2)

    print(f"  [Generator] Created template: {template_dir}")
    print(f"  [Generator] Subdomain: {subdomain}.dev.hazelgrouse.pl")

    return subdomain, template_dir


def generate_businesses(leads: list[dict]) -> list[dict]:
    """
    Generate business JSON + translations for a list of leads.
    Updates each lead with subdomain and status.

    Returns updated leads.
    """
    print(f"[Generator] Generating business profiles for {len(leads)} leads...")

    for lead in leads:
        try:
            subdomain, template_dir = create_template_folder(lead)
            lead["link_preview"] = f"https://{subdomain}.dev.hazelgrouse.pl"
            lead["status"] = "page_generated"
            lead["notatki"] = lead.get("notatki", "")
            if lead["notatki"]:
                lead["notatki"] += f" | subdomain: {subdomain}"
            else:
                lead["notatki"] = f"subdomain: {subdomain}"
        except Exception as e:
            print(f"  [Generator] Error for {lead.get('nazwa_firmy', '?')}: {e}")

    print(f"[Generator] Done. Generated {len(leads)} business profiles.")
    return leads


if __name__ == "__main__":
    # Quick test with sample data
    sample_lead = {
        "nazwa_firmy": "ElektroMax",
        "adres": "ul. Krakowska 15, 31-062 Kraków",
        "miasto": "Kraków",
        "telefon": "+48 12 345 67 89",
        "email": "biuro@elektromax.pl",
        "strona_www": "https://elektromax.pl",
        "branza": "electrician",
        "ocena": "4.8",
        "liczba_opinii": "127",
        "godziny_otwarcia": "Mo-Fr 08:00-17:00; Sa 09:00-13:00",
        "notatki": "",
    }

    subdomain, path = create_template_folder(sample_lead)
    print(f"\nCreated: {path}")
    print(f"Preview: https://{subdomain}.dev.hazelgrouse.pl")
