#!/usr/bin/env python3
"""
Main pipeline orchestrator.

Runs the full automation pipeline:
1. Load existing leads from CSV
2. Scrape new leads from free sources (OSM, Panorama Firm)
3. Deduplicate and filter
4. Enrich with website data
5. Generate business JSON → validate → save to templates/
6. Seed to PostgreSQL via db:seed
7. (Manual step: approve pages, add Coolify subdomain)
8. Send outreach emails to approved leads
9. Update CSV

Usage:
    python -m automation.pipeline scrape <category> <city>
    python -m automation.pipeline enrich
    python -m automation.pipeline generate [--limit N]
    python -m automation.pipeline validate
    python -m automation.pipeline seed
    python -m automation.pipeline approve <lead_id>
    python -m automation.pipeline reject <lead_id>
    python -m automation.pipeline send
    python -m automation.pipeline status
    python -m automation.pipeline full <category> <city> [--limit N]
"""

import csv
import subprocess
import sys
from pathlib import Path

from automation.config import LEADS_CSV, BASE_DIR
from automation.scrapers.osm_scraper import scrape_osm
from automation.scrapers.panorama_scraper import scrape_panorama
from automation.scrapers.lead_manager import (
    aggregate_leads, save_leads, load_existing_leads,
    get_leads_by_status, update_lead_status, CSV_FIELDS,
)
from automation.enrichment.web_enricher import enrich_leads
from automation.generator.business_generator import generate_businesses
from automation.generator.schema_validator import validate_business_json
from automation.sender.email_sender import send_outreach_emails


PROJECT_ROOT = BASE_DIR.parent
TEMPLATES_DIR = PROJECT_ROOT / "templates"


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

    updated = generate_businesses(leads)

    # Validate each generated JSON
    print(f"\n[Pipeline] Validating generated business JSONs...")
    for lead in updated:
        if lead.get("status") != "page_generated":
            continue
        # Extract subdomain from notes
        subdomain = None
        for part in lead.get("notatki", "").split("|"):
            if "subdomain:" in part:
                subdomain = part.split("subdomain:")[1].strip()
                break

        if subdomain:
            json_path = TEMPLATES_DIR / subdomain / f"{subdomain}.json"
            if json_path.exists():
                is_valid, errors = validate_business_json(json_path)
                if is_valid:
                    print(f"  [VALID] {subdomain}")
                else:
                    print(f"  [INVALID] {subdomain}: {errors}")
                    lead["status"] = "new"  # Reset status on validation failure

    _update_csv({l["id"]: l for l in updated})

    generated = [l for l in updated if l.get("status") == "page_generated"]
    print(f"\n[Pipeline] Generated {len(generated)} business profiles.")
    print("[Pipeline] Next steps:")
    print("  1. Review templates in templates/<subdomain>/")
    print("  2. Run: python -m automation.pipeline seed")
    print("  3. Add subdomain in Coolify")
    print("  4. Approve: python -m automation.pipeline approve <lead_id>")


def cmd_validate():
    """Validate all generated business JSON files."""
    print(f"\n{'='*60}")
    print(f"  SCHEMA VALIDATION")
    print(f"{'='*60}\n")

    from automation.generator.schema_validator import validate_all_generated
    results = validate_all_generated(TEMPLATES_DIR)

    valid = sum(1 for _, v, _ in results if v)
    invalid = sum(1 for _, v, _ in results if not v)
    print(f"\nResults: {valid} valid, {invalid} invalid, {len(results)} total")


def cmd_seed():
    """Run db:seed to insert generated businesses into PostgreSQL."""
    print(f"\n{'='*60}")
    print(f"  DATABASE SEED")
    print(f"{'='*60}\n")

    result = subprocess.run(
        ["pnpm", "-F", "@mshorizon/db", "db:seed"],
        capture_output=True,
        text=True,
        cwd=str(PROJECT_ROOT),
    )

    print(result.stdout)
    if result.stderr:
        print(result.stderr)

    if result.returncode == 0:
        print("[Pipeline] Seed complete.")
    else:
        print(f"[Pipeline] Seed failed with exit code {result.returncode}")


def cmd_approve(lead_id: str):
    """Manually approve a generated page."""
    update_lead_status(lead_id, "page_approved")


def cmd_reject(lead_id: str):
    """Manually reject a generated page."""
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

    # Show generated template folders
    print(f"\nGenerated templates:")
    # Skip known non-automation templates
    known = {"specialist", "dieta"}
    for subdir in sorted(TEMPLATES_DIR.iterdir()):
        if subdir.is_dir() and subdir.name not in known:
            json_file = subdir / f"{subdir.name}.json"
            if json_file.exists():
                print(f"  {subdir.name}.dev.hazelgrouse.pl")


def cmd_full(category: str, city: str, limit: int = 5, branza: str = ""):
    """Run full pipeline: scrape → enrich → generate → validate."""
    cmd_scrape(category, city)
    cmd_enrich()
    cmd_generate(limit=limit, branza=branza or category)
    print(f"\n{'='*60}")
    print("  PIPELINE COMPLETE")
    print(f"{'='*60}")
    print("\nNext steps:")
    print("  1. Review generated templates in templates/<subdomain>/")
    print("  2. Seed to DB:  python -m automation.pipeline seed")
    print("  3. Add Coolify subdomain for each business")
    print("  4. Approve:     python -m automation.pipeline approve <lead_id>")
    print("  5. Send emails: python -m automation.pipeline send")
    print("  6. Status:      python -m automation.pipeline status")


def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python -m automation.pipeline scrape <category> <city>")
        print("  python -m automation.pipeline enrich")
        print("  python -m automation.pipeline generate [--limit N]")
        print("  python -m automation.pipeline validate")
        print("  python -m automation.pipeline seed")
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

    elif command == "seed":
        cmd_seed()

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
