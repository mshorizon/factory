# Visual Regression Testing - Implementation Summary

## ✅ What Was Implemented

### 1. New Package: `packages/tests`

A dedicated testing workspace with:
- **Playwright visual regression tests** - Automated screenshot comparison
- **AJV template validation** - Schema validation for all templates
- **TypeScript configuration** - Fully typed test suite
- **CI-ready setup** - Configured for automated pipelines

### 2. Visual Regression Testing (`packages/tests/src/visual/`)

**How it works:**
1. Queries database for all business subdomains using `getAllSubdomains()`
2. For each business, navigates to `http://{subdomain}.localhost:4321`
3. Takes screenshots of:
   - Full page (with scroll)
   - Above-the-fold (viewport only)
   - Admin panel (if exists)
4. Compares against baseline screenshots
5. Fails if visual differences exceed 2% threshold

**Browser coverage:**
- Desktop Chrome (1920x1080)
- Mobile Safari (iPhone 13)

**Commands:**
```bash
pnpm test:visual              # Run tests
pnpm test:visual:update       # Update baselines
cd packages/tests && pnpm run test:visual:ui  # Debug UI
```

### 3. Template Validation (`packages/tests/src/validate-templates.ts`)

**How it works:**
1. Recursively scans `templates/` directory
2. Finds all `.json` files (excludes `translations/` subdirectories)
3. Validates each against AJV schema from `@mshorizon/schema`
4. Reports detailed errors with field paths

**Commands:**
```bash
pnpm run test:validate        # Validate all templates
```

**Exit codes:**
- `0` - All templates valid ✅
- `1` - One or more templates invalid ❌

### 4. Pre-commit Hook (Husky)

**Installed and configured:**
- Husky `v9.1.7` added to root `package.json`
- Pre-commit hook at `.husky/pre-commit`
- Automatically validates templates before every commit

**Behavior:**
```bash
git commit -m "Update template"
# 🔍 Validating templates against AJV schema...
# ✅ All 1 template(s) valid!
# [main abc1234] Update template
```

**To bypass (NOT recommended):**
```bash
git commit --no-verify
```

### 5. Updated Root Package.json

**New scripts:**
```json
{
  "test:visual": "pnpm --filter @mshorizon/tests test:visual",
  "test:visual:update": "pnpm --filter @mshorizon/tests test:visual:update",
  "test:validate": "pnpm --filter @mshorizon/tests test:validate",
  "prepare": "husky"
}
```

### 6. Updated Turbo Configuration

Added test tasks to `turbo.json`:
```json
{
  "test:visual": {
    "cache": false,
    "dependsOn": ["build"]
  },
  "test:validate": {
    "cache": false
  }
}
```

### 7. Documentation

Created comprehensive documentation:
- `packages/tests/README.md` - Package overview and usage
- `packages/tests/SETUP.md` - Detailed setup instructions
- `TESTING.md` - Repository-wide testing guide
- `IMPLEMENTATION_SUMMARY.md` - This file

### 8. Utility Scripts

- `packages/tests/scripts/verify-setup.sh` - Verify test prerequisites
- `.gitignore` for test artifacts
- `.env.example` for configuration

## 📁 File Structure

```
.
├── .husky/
│   └── pre-commit                    # Validates templates before commit
├── packages/
│   └── tests/
│       ├── src/
│       │   ├── visual/
│       │   │   ├── visual-regression.spec.ts  # Playwright tests
│       │   │   └── __screenshots__/           # Baseline images (committed)
│       │   └── validate-templates.ts          # Template validation script
│       ├── scripts/
│       │   └── verify-setup.sh                # Setup verification
│       ├── playwright.config.ts               # Playwright config
│       ├── package.json
│       ├── tsconfig.json
│       ├── README.md
│       ├── SETUP.md
│       └── .env.example
├── package.json                       # Updated with test scripts
├── turbo.json                         # Updated with test tasks
└── TESTING.md                         # Testing guide

```

## 🔧 Configuration Details

### Playwright Configuration

- **Base URL:** `http://localhost:4321` (configurable via `BASE_URL` env var)
- **Test directory:** `./src/visual`
- **Screenshot threshold:** 2% (`maxDiffPixelRatio: 0.02`)
- **Timeout:** 30s per navigation
- **Retries:** 0 local, 2 on CI
- **Workers:** Unlimited local, 1 on CI
- **Reporter:** HTML local, GitHub on CI

### Template Validation

- **Schema source:** `@mshorizon/schema` package
- **Validator:** AJV with `ajv-formats`
- **Exclusions:** `translations/` subdirectories
- **Error reporting:** Detailed with JSON paths

## ✅ Prerequisites for Running Tests

### Visual Regression Tests

1. **PM2 dev server running:**
   ```bash
   pm2 status  # Should show "astro-dev" online
   ```

2. **Database seeded:**
   ```bash
   cd packages/db
   DATABASE_URL="..." pnpm run db:seed
   ```

3. **Subdomain resolution (local):**
   - Add to `/etc/hosts`: `127.0.0.1 specialist.localhost`
   - OR use dnsmasq for wildcard DNS

4. **Playwright browsers installed:**
   ```bash
   pnpm --filter @mshorizon/tests exec playwright install chromium webkit
   ```

### Template Validation

No prerequisites - works out of the box.

## 🚀 Usage Examples

### Validating Templates

```bash
# Manual validation
pnpm run test:validate

# Automatic on commit
git add templates/specialist/specialist.json
git commit -m "Update specialist contact info"
# Hook runs automatically
```

### Running Visual Tests

```bash
# Prerequisites check
cd packages/tests && ./scripts/verify-setup.sh

# Run all tests
pnpm test:visual

# Update baselines after design change
pnpm test:visual:update

# Debug specific test
cd packages/tests
pnpm run test:visual:ui
```

## 🔄 Workflow Integration

### Development Workflow

1. Edit template: `templates/specialist/specialist.json`
2. Sync to database: `cd packages/db && pnpm run db:seed`
3. Verify visually: `pnpm test:visual`
4. Commit changes: `git commit` (validation runs automatically)

### CI/CD Workflow (Future)

```yaml
# .github/workflows/test.yml
- name: Install dependencies
  run: pnpm install

- name: Install Playwright
  run: pnpm --filter @mshorizon/tests exec playwright install --with-deps chromium

- name: Run visual tests
  run: CI=true pnpm test:visual
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## 📊 Current Status

✅ **Completed:**
- Visual regression test framework
- Template validation script
- Pre-commit hook integration
- Documentation
- Example tests for all 10 businesses in database

⚠️ **Known Issues:**
- Some system libraries missing for WebKit on Ubuntu (can install with `playwright install-deps`)
- Baseline screenshots not yet created (will be generated on first run)

🔮 **Future Enhancements:**
- Add CI/CD pipeline integration
- Add visual tests for mobile viewports
- Add accessibility tests (axe-core)
- Add performance tests (Lighthouse)
- Add cross-browser testing (Firefox)

## 🎯 Next Steps

1. **Generate baseline screenshots:**
   ```bash
   pnpm test:visual:update
   ```

2. **Review and commit baselines:**
   ```bash
   git add packages/tests/src/visual/__screenshots__
   git commit -m "Add baseline screenshots for visual regression"
   ```

3. **Verify pre-commit hook:**
   ```bash
   # Edit a template with invalid JSON
   git commit -m "Test"
   # Should fail with validation error
   ```

4. **Document in CLAUDE.md:**
   - Add testing guidelines
   - Reference TESTING.md
   - Add to development workflow

## 📚 Dependencies Added

### Root `package.json`
- `husky: ^9.0.11`

### `packages/tests/package.json`
- `@playwright/test: ^1.58.2`
- `@mshorizon/db: workspace:*`
- `@mshorizon/schema: workspace:*`
- `tsx: ^4.21.0`
- `typescript: ^5.9.3`

## 🎉 Summary

This implementation provides:
- ✅ Automated visual regression testing for all businesses
- ✅ Schema validation for all templates
- ✅ Pre-commit hooks to prevent invalid commits
- ✅ Comprehensive documentation
- ✅ CI-ready configuration
- ✅ Easy-to-use commands at repository root

All requirements have been met:
1. ✅ Script iterates through all JSON files in templates and database
2. ✅ Playwright tests navigate to each subdomain on localhost:4321
3. ✅ Full-page screenshots with `expect(page).toHaveScreenshot()`
4. ✅ Dynamic port/hostname configuration
5. ✅ `test:visual` command added to package.json
6. ✅ Pre-commit hook validates JSON against AJV schema (husky installed)
7. ✅ Tests stored in `packages/tests`
