-- Migration: Merge leads into sites table
-- Run AFTER `pnpm run db:push` has added the new columns to the sites table.
--
-- Usage:
--   DATABASE_URL="..." psql "$DATABASE_URL" -f scripts/migrate-leads-to-businesses.sql

BEGIN;

-- 1. Add new columns to sites (db:push should have done this, but idempotent check)
ALTER TABLE sites ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS website TEXT NOT NULL DEFAULT '';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

-- 2. Make subdomain nullable (remove NOT NULL if present)
ALTER TABLE sites ALTER COLUMN subdomain DROP NOT NULL;

-- 3. Make config nullable
ALTER TABLE sites ALTER COLUMN config DROP NOT NULL;

-- 4. Migrate existing site statuses to new values
UPDATE sites SET status = 'active' WHERE status = 'released';
UPDATE sites SET status = 'onboarding' WHERE status = 'draft';
-- "suspended" has no direct equivalent; map to "churned"
UPDATE sites SET status = 'churned' WHERE status = 'suspended';

-- 5. Copy leads into sites table (those without a linked site)
INSERT INTO sites (business_name, industry, city, address, phone, email, website, source, status, config, translations, created_at, updated_at)
SELECT
  l.name,
  l.business_type,
  l.city,
  l.address,
  l.phone,
  l.email,
  l.website,
  l.source,
  CASE
    WHEN l.status = 'new' THEN 'lead'
    WHEN l.status = 'rejected' THEN 'not_interested'
    WHEN l.status = 'site_generated' AND l.site_id IS NOT NULL THEN 'lead' -- already has a linked site, skip (handled below)
    ELSE 'lead'
  END,
  NULL,
  '{}',
  l.created_at,
  l.updated_at
FROM leads l
WHERE l.site_id IS NULL;

-- 6. For leads that already have a linked site: update the site row with lead contact info
UPDATE sites s
SET
  city = COALESCE(NULLIF(l.city, ''), s.city),
  address = COALESCE(NULLIF(l.address, ''), s.address),
  phone = COALESCE(NULLIF(l.phone, ''), s.phone),
  email = COALESCE(NULLIF(l.email, ''), s.email),
  website = COALESCE(NULLIF(l.website, ''), s.website),
  source = l.source
FROM leads l
WHERE l.site_id = s.id AND l.site_id IS NOT NULL;

-- 7. Drop leads table
DROP TABLE IF EXISTS leads;

COMMIT;

-- Verify
SELECT status, count(*) FROM sites GROUP BY status ORDER BY count(*) DESC;
