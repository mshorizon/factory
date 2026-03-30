"""
Lead aggregator and CSV tracker.

Combines results from multiple scrapers, deduplicates,
filters already-contacted firms, and manages the CSV database.
"""

import csv
import uuid
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass, fields

from automation.config import LEADS_CSV


CSV_FIELDS = [
    "id", "nazwa_firmy", "adres", "miasto", "telefon", "email",
    "strona_www", "branza", "ocena", "liczba_opinii", "godziny_otwarcia",
    "zrodlo", "data_znalezienia", "data_wyslania", "kanal_wyslania",
    "link_preview", "status", "data_odpowiedzi", "notatki",
]

SKIP_STATUSES = {"sent", "opened", "clicked", "replied", "converted", "rejected", "bounced"}


def load_existing_leads(csv_path: Path = LEADS_CSV) -> list[dict]:
    """Load all existing leads from CSV."""
    if not csv_path.exists():
        return []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


def _build_dedup_keys(leads: list[dict]) -> set[str]:
    """Build a set of dedup keys from existing leads."""
    keys = set()
    for lead in leads:
        # Deduplicate by name+city or phone or email
        name_city = f"{lead.get('nazwa_firmy', '').lower().strip()}|{lead.get('miasto', '').lower().strip()}"
        keys.add(name_city)
        phone = lead.get("telefon", "").strip()
        if phone:
            keys.add(f"phone|{phone}")
        email = lead.get("email", "").strip()
        if email:
            keys.add(f"email|{email.lower()}")
    return keys


def _is_duplicate(lead_dict: dict, dedup_keys: set[str]) -> bool:
    """Check if a lead is a duplicate of an existing one."""
    name_city = f"{lead_dict.get('nazwa_firmy', '').lower().strip()}|{lead_dict.get('miasto', '').lower().strip()}"
    if name_city in dedup_keys:
        return True
    phone = lead_dict.get("telefon", "").strip()
    if phone and f"phone|{phone}" in dedup_keys:
        return True
    email = lead_dict.get("email", "").strip()
    if email and f"email|{email.lower()}" in dedup_keys:
        return True
    return False


def aggregate_leads(
    *lead_lists,
    csv_path: Path = LEADS_CSV,
) -> list[dict]:
    """
    Aggregate leads from multiple scrapers, deduplicate against
    existing CSV and between sources.

    Args:
        *lead_lists: Lists of BusinessLead objects from scrapers
        csv_path: Path to the CSV tracker file

    Returns:
        List of new (non-duplicate) lead dicts ready to save
    """
    existing = load_existing_leads(csv_path)
    dedup_keys = _build_dedup_keys(existing)

    new_leads = []
    today = datetime.now().strftime("%Y-%m-%d")

    for lead_list in lead_lists:
        for lead in lead_list:
            lead_dict = lead.to_dict() if hasattr(lead, "to_dict") else dict(lead)

            if _is_duplicate(lead_dict, dedup_keys):
                continue

            # Add tracker fields
            lead_dict["id"] = str(uuid.uuid4())[:8]
            lead_dict["data_znalezienia"] = today
            lead_dict["data_wyslania"] = ""
            lead_dict["kanal_wyslania"] = ""
            lead_dict["link_preview"] = ""
            lead_dict["status"] = "new"
            lead_dict["data_odpowiedzi"] = ""
            lead_dict["notatki"] = ""

            # Add to dedup keys so we don't duplicate within this batch
            name_city = f"{lead_dict['nazwa_firmy'].lower().strip()}|{lead_dict['miasto'].lower().strip()}"
            dedup_keys.add(name_city)
            phone = lead_dict.get("telefon", "").strip()
            if phone:
                dedup_keys.add(f"phone|{phone}")
            email = lead_dict.get("email", "").strip()
            if email:
                dedup_keys.add(f"email|{email.lower()}")

            new_leads.append(lead_dict)

    return new_leads


def save_leads(new_leads: list[dict], csv_path: Path = LEADS_CSV):
    """Append new leads to the CSV file."""
    if not new_leads:
        print("[LeadManager] No new leads to save.")
        return

    file_exists = csv_path.exists() and csv_path.stat().st_size > 0

    with open(csv_path, "a", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS, extrasaction="ignore")
        if not file_exists:
            writer.writeheader()
        writer.writerows(new_leads)

    print(f"[LeadManager] Saved {len(new_leads)} new leads to {csv_path}")


def update_lead_status(lead_id: str, status: str, csv_path: Path = LEADS_CSV, **extra_fields):
    """Update the status of a lead by ID."""
    leads = load_existing_leads(csv_path)
    updated = False

    for lead in leads:
        if lead["id"] == lead_id:
            lead["status"] = status
            for key, value in extra_fields.items():
                if key in CSV_FIELDS:
                    lead[key] = value
            updated = True
            break

    if not updated:
        print(f"[LeadManager] Lead {lead_id} not found.")
        return

    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(leads)

    print(f"[LeadManager] Updated lead {lead_id} → status: {status}")


def get_leads_by_status(status: str, csv_path: Path = LEADS_CSV) -> list[dict]:
    """Get all leads with a given status."""
    leads = load_existing_leads(csv_path)
    return [l for l in leads if l.get("status") == status]


if __name__ == "__main__":
    leads = load_existing_leads()
    print(f"Total leads in CSV: {len(leads)}")
    for status in ["new", "page_generated", "page_approved", "sent", "opened", "clicked", "replied", "converted"]:
        count = len([l for l in leads if l.get("status") == status])
        if count:
            print(f"  {status}: {count}")
