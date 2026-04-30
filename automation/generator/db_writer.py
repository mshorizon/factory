"""
Direct PostgreSQL writer for generated business profiles.
Bypasses the file-based db:seed step.
"""

import json
import psycopg2
from automation.config import DATABASE_URL


def upsert_site(
    subdomain: str,
    business_name: str,
    industry: str,
    config: dict,
    translations: dict,
    status: str = "draft",
) -> None:
    """
    Upsert a business site directly into the 'sites' table.
    On conflict (subdomain already exists): updates config, translations, name, industry.
    Does NOT override status if the record already exists.
    """
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set — add it to .env")

    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO sites (subdomain, business_name, industry, status, config, translations)
                VALUES (%s, %s, %s, %s, %s::jsonb, %s::jsonb)
                ON CONFLICT (subdomain) DO UPDATE SET
                    business_name = EXCLUDED.business_name,
                    industry      = EXCLUDED.industry,
                    config        = EXCLUDED.config,
                    translations  = EXCLUDED.translations,
                    updated_at    = NOW()
                """,
                (
                    subdomain,
                    business_name,
                    industry,
                    status,
                    json.dumps(config, ensure_ascii=False),
                    json.dumps(translations, ensure_ascii=False),
                ),
            )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def set_site_status(subdomain: str, status: str) -> bool:
    """
    Update only the status field for a site.
    Returns True if a row was updated, False if subdomain not found.
    """
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set — add it to .env")

    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE sites SET status = %s, updated_at = NOW() WHERE subdomain = %s",
                (status, subdomain),
            )
            updated = cur.rowcount
        conn.commit()
        return updated > 0
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
