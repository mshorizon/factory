# 🧪 Testing Guide

## Overview

The Factory uses automated testing to ensure:
1. **Visual Regression** - All business websites render correctly
2. **Schema Validation** - All template JSON files conform to the schema

## Quick Start

```bash
# Validate templates (runs automatically on git commit)
pnpm run test:validate

# Run visual regression tests (requires PM2 dev server + database)
pnpm run test:visual

# Update screenshot baselines after design changes
pnpm run test:visual:update
```

## 📸 Visual Regression Testing

Located in `packages/tests/src/visual/`.

### How It Works

1. Queries database for all business subdomains
2. Navigates to each subdomain (e.g., `http://specialist.localhost:4321`)
3. Takes full-page screenshots
4. Compares against baseline screenshots
5. Fails if visual differences exceed 2% threshold

### Prerequisites

**1. PM2 dev server must be running:**
```bash
pm2 status
# Should show "astro-dev" as "online"
```

**2. Database must be seeded:**
```bash
cd packages/db && DATABASE_URL="..." pnpm run db:seed
```

**3. Subdomain resolution (local development):**

Add to `/etc/hosts`:
```
127.0.0.1 specialist.localhost
```

Or use wildcard DNS (dnsmasq):
```bash
echo "address=/.localhost/127.0.0.1" | sudo tee /etc/dnsmasq.d/localhost-wildcard.conf
sudo systemctl restart dnsmasq
```

### Running Tests

```bash
# Run all visual tests
pnpm test:visual

# Update baselines (after intentional changes)
pnpm test:visual:update

# Debug mode with UI
cd packages/tests && pnpm run test:visual:ui
```

### Test Coverage

- **Full page screenshots** - Complete page with scroll
- **Above-the-fold** - Viewport-only (hero section)
- **Common routes** - `/` and `/admin` for each business

### Browser Coverage

- **Desktop Chrome** (1920x1080)
- **Mobile Safari** (iPhone 13 viewport)

Add more in `packages/tests/playwright.config.ts`.

## ✅ Template Validation

Located in `packages/tests/src/validate-templates.ts`.

### How It Works

1. Recursively scans `templates/` directory
2. Finds all `.json` files (excluding `translations/`)
3. Validates each against AJV schema from `@mshorizon/schema`
4. Reports errors with detailed messages

### Running Manually

```bash
pnpm run test:validate
```

### Pre-commit Hook

Automatically validates templates before every commit:

```bash
git add templates/specialist/specialist.json
git commit -m "Update specialist template"

# Output:
# 🔍 Validating templates against AJV schema...
# ✅ All 1 template(s) valid!
```

If validation fails, the commit is blocked:
```bash
# ❌ 1 of 1 template(s) failed validation
# Error: business.contact.phone: must match pattern...
```

To bypass (NOT recommended):
```bash
git commit --no-verify
```

## 📁 Directory Structure

```
packages/tests/
├── src/
│   ├── visual/
│   │   ├── visual-regression.spec.ts  # Playwright tests
│   │   └── __screenshots__/           # Baseline screenshots (committed to git)
│   └── validate-templates.ts          # Template validation script
├── playwright.config.ts               # Playwright configuration
├── package.json
├── README.md                          # Package documentation
└── SETUP.md                           # Detailed setup guide
```

## 🚀 CI/CD Integration

For automated pipelines:

```bash
# Install browsers with system dependencies
pnpm --filter @mshorizon/tests exec playwright install --with-deps chromium

# Run tests with CI reporter
CI=true pnpm test:visual
```

## 🐛 Troubleshooting

### "No businesses in database"
```bash
cd packages/db && DATABASE_URL="..." pnpm run db:seed
```

### Subdomain not resolving
```bash
# Test manually
curl http://specialist.localhost:4321

# Should return HTML, not connection error
```

### Screenshot mismatches

Common causes:
- Fonts not loaded (check web fonts)
- Animations running (should be disabled in tests)
- Dynamic timestamps or content
- Different system fonts

Fix:
```bash
# Update baselines if changes are intentional
pnpm test:visual:update
```

### Missing system libraries (WebKit on Linux)
```bash
pnpm --filter @mshorizon/tests exec playwright install-deps webkit
```

## 📚 Further Reading

- [Playwright Documentation](https://playwright.dev/)
- [AJV Schema Validation](https://ajv.js.org/)
- See `packages/tests/SETUP.md` for detailed setup instructions
