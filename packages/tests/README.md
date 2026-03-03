# @mshorizon/tests

Visual regression testing and template validation for MS Horizon Factory.

## 🎯 Purpose

This package provides:
1. **Visual Regression Tests** - Automated screenshot comparison for all business sites
2. **Template Validation** - AJV schema validation for all JSON templates

## 🚀 Quick Start

### Prerequisites

Ensure the PM2 dev server is running:
```bash
pm2 status
# If not running:
# PORT=4321 HOST=0.0.0.0 pm2 start npm --name "astro-dev" -- run dev -- -- --host 0.0.0.0 --disable-host-check
```

Ensure database is seeded:
```bash
cd packages/db && DATABASE_URL="postgresql://..." pnpm run db:seed
```

### Run Tests

```bash
# From repository root
pnpm test:visual

# Or from this package
cd packages/tests
pnpm run test:visual
```

## 📸 Visual Regression Tests

### How It Works

1. Queries the database for all business subdomains using `getAllSubdomains()`
2. For each subdomain, navigates to `http://{subdomain}.localhost:4321`
3. Takes full-page screenshots and compares against baseline
4. Fails if visual differences exceed threshold (2% by default)

### Test Scenarios

- **Full Page** - Complete page screenshot with scroll
- **Above the Fold** - Viewport-only screenshot (hero section)
- **Common Routes** - `/` and `/admin` for each business

### Update Baselines

When intentional design changes are made:
```bash
pnpm run test:visual:update
```

### Interactive Mode

Debug tests with Playwright UI:
```bash
pnpm run test:visual:ui
```

### Screenshots Location

Stored in `src/visual/__screenshots__/` and committed to git for comparison.

## ✅ Template Validation

Validates all JSON files in `templates/` against the AJV schema from `@mshorizon/schema`.

```bash
pnpm run test:validate
```

### Exit Codes
- `0` - All templates valid
- `1` - One or more templates invalid (prints errors)

## 🪝 Pre-commit Hook

A husky pre-commit hook automatically validates templates before every commit:
```bash
# Runs automatically on git commit
pnpm run test:validate
```

To bypass (not recommended):
```bash
git commit --no-verify
```

## 🧪 Projects (Browsers)

Tests run on multiple configurations:
- **chromium-desktop** - 1920x1080 (Desktop Chrome)
- **mobile-safari** - iPhone 13 viewport

Add more in `playwright.config.ts` if needed.

## 🔧 Configuration

Edit `playwright.config.ts` to adjust:
- Base URL (default: `http://localhost:4321`)
- Screenshot threshold (`maxDiffPixelRatio`)
- Timeout values
- Additional browsers

## 🐛 Troubleshooting

### "No businesses in database" error

Ensure database is seeded:
```bash
cd packages/db
DATABASE_URL="postgresql://..." pnpm run db:seed
```

### Screenshot mismatches

Check if:
- Fonts are loaded correctly
- Images are not lazy-loading differently
- Animations are disabled in tests
- System time/date affects rendered content

### Subdomain resolution not working

Ensure your `/etc/hosts` includes:
```
127.0.0.1 specialist.localhost
```

Or use a wildcard DNS tool like `dnsmasq`.

## 📦 Dependencies

- `@playwright/test` - Visual regression framework
- `@mshorizon/db` - Database queries for subdomains
- `@mshorizon/schema` - AJV validation
- `tsx` - TypeScript execution for scripts
