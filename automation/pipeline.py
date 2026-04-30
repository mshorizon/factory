#!/usr/bin/env python3
"""
Main pipeline orchestrator.

Runs the full automation pipeline:
1. Load existing leads from CSV
2. Scrape new leads from free sources (OSM, Panorama Firm)
3. Deduplicate and filter
4. Enrich with website data
5. Generate business JSON → validate → write directly to PostgreSQL (status=draft)
6. (Manual step: approve pages, add Coolify subdomain)
7. Send outreach emails to approved leads
8. Update CSV

Usage:
    python -m automation.pipeline scrape <category> <city>
    python -m automation.pipeline enrich
    python -m automation.pipeline generate [--limit N]
    python -m automation.pipeline validate
    python -m automation.pipeline approve <lead_id>
    python -m automation.pipeline reject <lead_id>
    python -m automation.pipeline send
    python -m automation.pipeline status
    python -m automation.pipeline full <category> <city> [--limit N]
"""

import csv
import sys

from automation.config import LEADS_CSV, BASE_DIR
from automation.scrapers.osm_scraper import scrape_osm
from automation.scrapers.panorama_scraper import scrape_panorama
from automation.scrapers.lead_manager import (
    aggregate_leads, save_leads, load_existing_leads,
    get_leads_by_status, update_lead_status, CSV_FIELDS,
)
from automation.enrichment.web_enricher import enrich_leads
from automation.generator.business_generator import generate_businesses, generate_for_db
from automation.generator.schema_validator import validate_business_dict
from automation.generator.db_writer import set_site_status
from automation.sender.email_sender import send_outreach_emails


PROJECT_ROOT = BASE_DIR.parent


def _update_csv(leads_by_id: dict):
    """Update CSV with modified leads."""
    all_leads = load_existing_leads()
    for lead in all_leads:
        if lead["id"] in leads_by_id:
            lead.update(leads_by_id[lead["id"]])

    with open(LEADS_CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(all_leads)


def cmd_scrape(category: str, city: str):
    """Scrape leads from all free sources and save to CSV."""
    print(f"\n{'='*60}")
    print(f"  SCRAPING: {category} in {city}")
    print(f"{'='*60}\n")

    osm_leads = scrape_osm(category, city)
    panorama_leads = scrape_panorama(category, city)

    new_leads = aggregate_leads(osm_leads, panorama_leads)

    print(f"\n[Pipeline] New unique leads: {len(new_leads)}")
    print(f"  - from OSM: {len(osm_leads)}")
    print(f"  - from Panorama Firm: {len(panorama_leads)}")

    save_leads(new_leads)
    return new_leads


def cmd_enrich():
    """Enrich all leads with status 'new'."""
    print(f"\n{'='*60}")
    print(f"  ENRICHMENT")
    print(f"{'='*60}\n")

    leads = get_leads_by_status("new")
    if not leads:
        print("[Pipeline] No new leads to enrich.")
        return

    enriched = enrich_leads(leads)
    _update_csv({l["id"]: l for l in enriched})
    print(f"[Pipeline] Enriched {len(enriched)} leads.")


def cmd_generate(limit: int = 5, branza: str = ""):
    """Generate business JSON + translations for leads with status 'new'."""
    print(f"\n{'='*60}")
    print(f"  BUSINESS JSON GENERATION")
    print(f"{'='*60}\n")

    leads = get_leads_by_status("new")

    # Filter by industry if specified
    if branza:
        leads = [l for l in leads if l.get("branza") == branza]
        print(f"[Pipeline] Filtered to branza='{branza}': {len(leads)} leads")

    if not leads:
        print("[Pipeline] No new leads to generate businesses for.")
        return

    # Limit to avoid mass generation
    if limit and len(leads) > limit:
        print(f"[Pipeline] Limiting to {limit} leads (of {len(leads)} total). Use --limit N to change.")
        leads = leads[:limit]

    # Validate in memory before generating (pre-flight check)
    print(f"\n[Pipeline] Validating business JSONs before saving...")
    valid_leads = []
    for lead in leads:
        try:
            _, config, _ = generate_for_db(lead)
            is_valid, errors = validate_business_dict(config)
            if is_valid:
                print(f"  [VALID] {lead.get('nazwa_firmy', '?')}")
                valid_leads.append(lead)
            else:
                print(f"  [INVALID] {lead.get('nazwa_firmy', '?')}: {errors}")
        except Exception as e:
            print(f"  [ERROR] {lead.get('nazwa_firmy', '?')}: {e}")

    if not valid_leads:
        print("[Pipeline] No valid leads to save.")
        return

    updated = generate_businesses(valid_leads)

    _update_csv({l["id"]: l for l in updated})

    generated = [l for l in updated if l.get("status") == "page_generated"]
    print(f"\n[Pipeline] Generated {len(generated)} business profiles → saved to DB (status=draft).")
    print("[Pipeline] Next steps:")
    print("  1. Review at https://<subdomain>.dev.hazelgrouse.pl")
    print("  2. Approve: python -m automation.pipeline approve <lead_id>")
    print("  3. Add subdomain in Coolify")


def cmd_validate():
    """Validate business JSONs generated from current new leads (in memory)."""
    print(f"\n{'='*60}")
    print(f"  SCHEMA VALIDATION")
    print(f"{'='*60}\n")

    leads = get_leads_by_status("new") + get_leads_by_status("page_generated")
    if not leads:
        print("[Pipeline] No leads to validate.")
        return

    valid = 0
    invalid = 0
    for lead in leads:
        try:
            _, config, _ = generate_for_db(lead)
            is_valid, errors = validate_business_dict(config)
            status = "VALID" if is_valid else "INVALID"
            print(f"  [{status}] {lead.get('nazwa_firmy', '?')}")
            if errors:
                print(f"    {errors}")
            if is_valid:
                valid += 1
            else:
                invalid += 1
        except Exception as e:
            print(f"  [ERROR] {lead.get('nazwa_firmy', '?')}: {e}")
            invalid += 1

    print(f"\nResults: {valid} valid, {invalid} invalid, {valid + invalid} total")


def cmd_approve(lead_id: str):
    """Approve a generated page: set DB status to released + update CSV."""
    all_leads = load_existing_leads()
    lead = next((l for l in all_leads if l["id"] == lead_id), None)
    if not lead:
        print(f"[Pipeline] Lead not found: {lead_id}")
        return

    subdomain = None
    for part in lead.get("notatki", "").split("|"):
        if "subdomain:" in part:
            subdomain = part.split("subdomain:")[1].strip()
            break

    if subdomain:
        updated = set_site_status(subdomain, "released")
        if updated:
            print(f"[Pipeline] DB status → released: {subdomain}")
        else:
            print(f"[Pipeline] WARNING: subdomain '{subdomain}' not found in DB")
    else:
        print(f"[Pipeline] WARNING: no subdomain in notes for lead {lead_id}")

    update_lead_status(lead_id, "page_approved")


def cmd_reject(lead_id: str):
    """Reject a generated page: set DB status to suspended + update CSV."""
    all_leads = load_existing_leads()
    lead = next((l for l in all_leads if l["id"] == lead_id), None)
    if not lead:
        print(f"[Pipeline] Lead not found: {lead_id}")
        return

    subdomain = None
    for part in lead.get("notatki", "").split("|"):
        if "subdomain:" in part:
            subdomain = part.split("subdomain:")[1].strip()
            break

    if subdomain:
        set_site_status(subdomain, "suspended")
        print(f"[Pipeline] DB status → suspended: {subdomain}")

    update_lead_status(lead_id, "page_rejected")


def cmd_send():
    """Send emails to all approved leads."""
    print(f"\n{'='*60}")
    print(f"  EMAIL SENDING")
    print(f"{'='*60}\n")

    all_leads = load_existing_leads()
    updated = send_outreach_emails(all_leads)
    _update_csv({l["id"]: l for l in updated})


def cmd_status():
    """Show pipeline status summary."""
    leads = load_existing_leads()
    print(f"\n{'='*60}")
    print(f"  PIPELINE STATUS")
    print(f"{'='*60}\n")
    print(f"Total leads: {len(leads)}\n")

    statuses = [
        "new", "page_generated", "page_approved", "page_rejected",
        "sent", "opened", "clicked", "replied", "converted",
        "rejected", "bounced",
    ]
    for status in statuses:
        count = len([l for l in leads if l.get("status") == status])
        if count:
            print(f"  {status:20s} {count}")

    if not leads:
        print("  (no leads yet)")

    approved = [l for l in leads if l.get("status") == "page_approved"]
    if approved:
        print(f"\nApproved (live in DB):")
        for l in approved:
            subdomain = next(
                (p.split("subdomain:")[1].strip() for p in l.get("notatki", "").split("|") if "subdomain:" in p),
                "?",
            )
            print(f"  {subdomain}.dev.hazelgrouse.pl")


def cmd_full(category: str, city: str, limit: int = 5, branza: str = ""):
    """Run full pipeline: scrape → enrich → validate → generate → save to DB."""
    cmd_scrape(category, city)
    cmd_enrich()
    cmd_generate(limit=limit, branza=branza or category)
    print(f"\n{'='*60}")
    print("  PIPELINE COMPLETE")
    print(f"{'='*60}")
    print("\nNext steps:")
    print("  1. Review at https://<subdomain>.dev.hazelgrouse.pl")
    print("  2. Add Coolify subdomain for each business")
    print("  3. Approve:     python -m automation.pipeline approve <lead_id>")
    print("  4. Send emails: python -m automation.pipeline send")
    print("  5. Status:      python -m automation.pipeline status")


def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python -m automation.pipeline scrape <category> <city>")
        print("  python -m automation.pipeline enrich")
        print("  python -m automation.pipeline generate [--limit N]")
        print("  python -m automation.pipeline validate")
        print("  python -m automation.pipeline approve <lead_id>")
        print("  python -m automation.pipeline reject <lead_id>")
        print("  python -m automation.pipeline send")
        print("  python -m automation.pipeline status")
        print("  python -m automation.pipeline full <category> <city> [--limit N]")
        print()
        print("Categories: restauracja, kawiarnia, fryzjer, mechanik, dentysta, ...")
        print("Cities: Kraków, Warszawa, Wrocław, Poznań, Gdańsk, ...")
        sys.exit(1)

    command = sys.argv[1]

    # Parse flags
    limit = 5
    if "--limit" in sys.argv:
        idx = sys.argv.index("--limit")
        if idx + 1 < len(sys.argv):
            limit = int(sys.argv[idx + 1])

    branza = ""
    if "--branza" in sys.argv:
        idx = sys.argv.index("--branza")
        if idx + 1 < len(sys.argv):
            branza = sys.argv[idx + 1]

    if command == "scrape":
        if len(sys.argv) < 4:
            print("Usage: python -m automation.pipeline scrape <category> <city>")
            sys.exit(1)
        cmd_scrape(sys.argv[2], sys.argv[3])

    elif command == "enrich":
        cmd_enrich()

    elif command == "generate":
        cmd_generate(limit=limit, branza=branza)

    elif command == "validate":
        cmd_validate()

    elif command == "approve":
        if len(sys.argv) < 3:
            print("Usage: python -m automation.pipeline approve <lead_id>")
            sys.exit(1)
        cmd_approve(sys.argv[2])

    elif command == "reject":
        if len(sys.argv) < 3:
            print("Usage: python -m automation.pipeline reject <lead_id>")
            sys.exit(1)
        cmd_reject(sys.argv[2])

    elif command == "send":
        cmd_send()

    elif command == "status":
        cmd_status()

    elif command == "full":
        if len(sys.argv) < 4:
            print("Usage: python -m automation.pipeline full <category> <city> [--limit N]")
            sys.exit(1)
        cmd_full(sys.argv[2], sys.argv[3], limit=limit)

    else:
        print(f"Unknown command: {command}")
        sys.exit(1)


if __name__ == "__main__":
    main()
