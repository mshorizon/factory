"""
HTML page generator using Jinja2 templates.

Generates a personalized preview website for each business lead.
"""

import re
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

from jinja2 import Environment, FileSystemLoader

from automation.config import TEMPLATES_DIR, OUTPUT_DIR


# Polish display names for categories
BRANZA_DISPLAY = {
    "restauracja": "Restauracja",
    "kawiarnia": "Kawiarnia",
    "bar": "Bar",
    "pub": "Pub",
    "fast_food": "Fast Food",
    "fryzjer": "Salon fryzjerski",
    "kosmetyczka": "Salon kosmetyczny",
    "mechanik": "Warsztat samochodowy",
    "dentysta": "Gabinet dentystyczny",
    "lekarz": "Gabinet lekarski",
    "apteka": "Apteka",
    "kwiaciarnia": "Kwiaciarnia",
    "piekarnia": "Piekarnia",
    "sklep_spozywczy": "Sklep spożywczy",
    "siłownia": "Siłownia / Fitness",
    "hotel": "Hotel",
    "weterynarz": "Weterynarz",
    "optyk": "Optyk",
    "fotograf": "Studio fotograficzne",
    "pralnia": "Pralnia",
}


def _slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    text = text.lower().strip()
    # Polish chars
    replacements = {
        "ą": "a", "ć": "c", "ę": "e", "ł": "l", "ń": "n",
        "ó": "o", "ś": "s", "ź": "z", "ż": "z",
    }
    for pl, en in replacements.items():
        text = text.replace(pl, en)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def _parse_opening_hours(hours_str: str) -> list[tuple[str, str]]:
    """
    Parse OSM-style opening hours into a list of (day, hours) tuples.
    E.g. "Mo-Fr 09:00-17:00; Sa 10:00-14:00" → [("Pon-Pt", "09:00-17:00"), ...]
    """
    if not hours_str:
        return []

    day_map = {
        "Mo": "Pon", "Tu": "Wt", "We": "Śr", "Th": "Czw",
        "Fr": "Pt", "Sa": "Sob", "Su": "Nd",
    }

    result = []
    parts = hours_str.split(";")
    for part in parts:
        part = part.strip()
        if not part:
            continue
        # Try to split into days and time
        tokens = part.split(" ", 1)
        if len(tokens) == 2:
            days, time_range = tokens
            # Replace English day codes with Polish
            for en, pl in day_map.items():
                days = days.replace(en, pl)
            result.append((days, time_range))
        else:
            result.append(("", part))

    return result


def generate_page(lead: dict, template_name: str = "universal.html") -> str:
    """
    Generate an HTML preview page for a business lead.

    Args:
        lead: Lead dict with business data
        template_name: Jinja2 template filename

    Returns:
        Path to the generated HTML file (relative to output dir)
    """
    env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))
    template = env.get_template(template_name)

    slug = _slugify(lead.get("nazwa_firmy", "firma"))
    adres = lead.get("adres", "")

    context = {
        **lead,
        "branza_display": BRANZA_DISPLAY.get(lead.get("branza", ""), lead.get("branza", "")),
        "adres_encoded": quote(f"{lead.get('nazwa_firmy', '')} {adres}"),
        "godziny_parsed": _parse_opening_hours(lead.get("godziny_otwarcia", "")),
        "year": datetime.now().year,
    }

    html = template.render(**context)

    # Save to output
    output_dir = OUTPUT_DIR / "pages"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / f"{slug}.html"
    output_file.write_text(html, encoding="utf-8")

    print(f"  [Generator] Created page: {output_file.name}")
    return str(output_file)


def generate_pages(leads: list[dict]) -> list[dict]:
    """
    Generate preview pages for a list of leads.
    Updates each lead dict with link_preview and status.

    Returns the updated leads list.
    """
    print(f"[Generator] Generating pages for {len(leads)} leads...")

    for lead in leads:
        path = generate_page(lead)
        lead["link_preview"] = path
        lead["status"] = "page_generated"

    print(f"[Generator] Done. Generated {len(leads)} pages.")
    return leads
