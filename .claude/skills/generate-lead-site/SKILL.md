---
name: generate-lead-site
description: Generate a full website for a lead based on their business info and existing website. Reads lead from DB, scrapes their website with Playwright, selects the best template, generates a complete business JSON, saves to DB, and updates lead status to site_generated.
---

## Usage

```
/generate-lead-site <lead-id>
```

Example: `/generate-lead-site 42`

---

## Workflow Overview

1. Load lead from DB
2. Scrape their existing website (if any) with Playwright
3. Select best template based on business type
4. Generate complete business JSON (in Polish, localized for their city)
5. Validate JSON against schema
6. Upsert to DB via `upsertSiteConfig`
7. Update lead status → `site_generated`

---

## PHASE 1 — Load Lead

Parse `<lead-id>` from the skill arguments. Then load the lead:

```bash
tsx /home/dev/factory/scripts/lead-db.ts get-lead <lead-id>
```

This outputs a JSON object with fields:
- `id`, `name`, `businessType`, `city`, `address`, `phone`, `email`, `website`, `source`, `status`, `generatedSubdomain`

If lead not found → abort with error message.

**Generate subdomain** if `generatedSubdomain` is null:
```
slug = lead.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30)
```
This will be the subdomain for the new site (e.g. `jan-kowalski-elektryka`).

---

## PHASE 2 — Scrape Existing Website (if lead.website is set)

If `lead.website` is empty/null → skip this phase.

Use Playwright MCP to analyze the lead's existing website:

```
1. mcp__playwright__browser_navigate → lead.website
2. mcp__playwright__browser_take_screenshot (fullPage: false) → screenshot viewport
3. Scroll and take 2-3 more screenshots of different sections
4. mcp__playwright__browser_snapshot → get accessibility tree / HTML structure
```

Extract as much as possible:
- **Business name** (may differ from OSM)
- **Services offered** (names, descriptions, prices if visible)
- **Phone, email, address** (may be more accurate than OSM data)
- **Opening hours**
- **Tagline / hero text**
- **Color scheme** (primary color, dark/light theme)
- **About/story text**
- **Service area / coverage zones**
- **Social media links**
- **Any testimonials or ratings**
- **Images** (note URLs for reference)

If the website is broken/unreachable → note it and continue with OSM data only.

---

## PHASE 3 — Template Selection

Based on `lead.businessType`, select the best template:

| Business Types | Template |
|---|---|
| electrician, plumber, painter, carpenter, locksmith, car_repair | `template-specialist` |
| lawyer, notary, accountant, doctor, dentist, pharmacy, veterinary | `template-law` |
| hairdresser, beauty, gym, florist | `template-art` |
| restaurant, cafe, hotel | `template-specialist` (food variant) |
| Default / unknown | `template-specialist` |

Read the chosen template as a reference structure:
```bash
cat /home/dev/factory/templates/<chosen-template>/<chosen-template>.json
```

Also read the schema for valid field names:
```bash
cat /home/dev/factory/packages/schema/src/business.schema.json | head -200
```

---

## PHASE 4 — Generate Business JSON

Create a complete `BusinessProfile` JSON. Use the template as a structural reference but fill with real data from the lead and scraped website.

### Key rules:
- **Language**: Polish — all copy, service names, taglines in Polish
- **Real data**: Use actual name, phone, email, address from lead/website
- **No `t:` translation keys** — these are for template blueprints only; use real Polish strings
- **No placeholder URLs** for images — use `""` or omit image fields if no real image available
- **City-appropriate**: use the lead's actual city in address and service areas
- **Subdomain**: use the generated slug from Phase 1

### Required structure:

```json
{
  "business": {
    "id": "<subdomain>-001",
    "name": "<actual business name>",
    "industry": "<businessType>",
    "assets": {
      "favicon": "",
      "icon": ""
    },
    "contact": {
      "address": "<real address from lead/website>",
      "phone": "<real phone>",
      "email": "<real email or empty string>",
      "hours": "<hours if found, else 'Pon-Pt: 8:00-17:00'>"
    }
  },
  "theme": {
    "preset": "<bold for specialist/art, minimal for law/tech>",
    "majorTheme": "<chosen template name>",
    "mode": "light",
    "colors": {
      "light": {
        "primary": "<extracted primary color or template default>",
        "surface": { "base": "#FFFFFF", "alt": "#F8F8F8", "card": "#FFFFFF" },
        "text": { "main": "#1A1A1A", "muted": "#6B7280", "onPrimary": "#FFFFFF" }
      },
      "dark": {
        "primary": "<same primary>",
        "surface": { "base": "#0F0F0F", "alt": "#1A1A1A", "card": "#1F1F1F" },
        "text": { "main": "#F5F5F5", "muted": "#9CA3AF", "onPrimary": "#FFFFFF" }
      }
    },
    "typography": {
      "primary": "'Inter', system-ui, sans-serif",
      "secondary": "'Inter', system-ui, sans-serif"
    },
    "ui": {
      "radius": "8px",
      "spacing": {
        "xs": "0.5rem", "sm": "0.75rem", "md": "1rem", "lg": "1.5rem",
        "xl": "2rem", "2xl": "3rem", "3xl": "4rem",
        "section-sm": "5rem", "section": "7.5rem", "container": "2.5rem"
      }
    }
  },
  "layout": {
    "navbar": { "variant": "standard" },
    "footer": {
      "variant": "minimal",
      "copyright": "© 2025 <business name>. Wszelkie prawa zastrzeżone.",
      "tagline": "<short tagline>",
      "links": []
    }
  },
  "navigation": {
    "cta": { "label": "Kontakt", "target": { "type": "page", "value": "contact" } }
  },
  "data": {
    "services": [
      {
        "id": "svc-1",
        "name": "<service name>",
        "description": "<description>",
        "price": "<price or empty string>"
      }
    ]
  },
  "pages": {
    "home": {
      "title": "<business name>",
      "sections": [
        { "type": "hero", "variant": "default" },
        { "type": "services", "variant": "grid" },
        { "type": "about", "variant": "story" },
        { "type": "contact", "variant": "centered" }
      ]
    },
    "about": {
      "title": "O nas",
      "sections": [
        { "type": "about", "variant": "story" },
        { "type": "contact", "variant": "centered" }
      ]
    },
    "contact": {
      "title": "Kontakt",
      "sections": [
        { "type": "contact", "variant": "centered" }
      ]
    }
  },
  "sharedSections": {}
}
```

### Section data:
- `hero` section: add `data.hero` with `headline`, `subheadline`, `ctaLabel: "Zadzwoń teraz"`, `ctaLink: "tel:<phone>"`
- `services` section: reference `data.services` array — add 3-6 real services from the website
- `about` section: add `data.about` with `headline`, `body` (paragraph about the business, 2-4 sentences)
- `contact` section: add `data.contact` referencing the business contact info

If you found specific copy from the website, use it. Otherwise generate realistic Polish copy appropriate for the business type and city.

---

## PHASE 5 — Validate JSON

Save the generated JSON to a temp file and validate:

```bash
# Write to temp file
cat > /tmp/lead-<id>-generated.json << 'EOF'
<generated JSON>
EOF

# Validate against schema
cd /home/dev/factory && pnpm test:validate 2>&1 | head -50
```

If there are validation errors:
1. Read the error message carefully
2. Fix the JSON
3. Re-validate
4. Repeat until 0 errors

---

## PHASE 6 — Save to Database

Use `upsertSiteConfig` via a small Node script:

```bash
DATABASE_URL="postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db" \
tsx --eval "
import { initDb, upsertSiteConfig } from './packages/db/src/index.js';
initDb(process.env.DATABASE_URL);
const config = $(cat /tmp/lead-<id>-generated.json | node -e 'let d=\"\"; process.stdin.on(\"data\",c=>d+=c); process.stdin.on(\"end\",()=>process.stdout.write(JSON.stringify(JSON.parse(d))))');
await upsertSiteConfig('<subdomain>', config);
console.log('Saved');
" /home/dev/factory
```

**Simpler approach** — write an inline script to a temp file and run it:

```bash
cat > /tmp/save-lead-site.mjs << 'SCRIPT'
import { initDb, upsertSiteConfig } from '/home/dev/factory/packages/db/src/index.js';
import { readFileSync } from 'fs';

const DATABASE_URL = "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";
initDb(DATABASE_URL);

const config = JSON.parse(readFileSync('/tmp/lead-<id>-generated.json', 'utf8'));
await upsertSiteConfig('<subdomain>', config);
console.log('Site saved to DB:', '<subdomain>');
SCRIPT

node /tmp/save-lead-site.mjs
```

---

## PHASE 7 — Update Lead Status

```bash
tsx /home/dev/factory/scripts/lead-db.ts set-lead-status <lead-id> site_generated <subdomain>
```

---

## PHASE 8 — Verify & Report

Restart the dev server so the new site is live:
```bash
pm2 restart astro-dev
```

Take a screenshot to verify:
```
mcp__playwright__browser_navigate → https://<subdomain>.dev.hazelgrouse.pl/
mcp__playwright__browser_take_screenshot
```

Report to user:
- Business name and lead ID
- Subdomain: `<subdomain>.hazelgrouse.pl`
- Dev preview: `https://<subdomain>.dev.hazelgrouse.pl/`
- Template used
- Services found/generated
- What was scraped vs generated
- Any manual improvements needed (images, more accurate contact info, etc.)

---

## Error Handling

- **Lead not found**: `Lead with ID <n> not found in database.`
- **Website unreachable**: Continue with OSM data only, note in report
- **Validation errors**: Fix and retry — do NOT save invalid JSON
- **DB save fails**: Show the error, do not update lead status
- **Lead already site_generated**: Ask user if they want to regenerate (overwrite)
