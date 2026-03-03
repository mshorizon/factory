# Testing Setup Guide

## Prerequisites

### 1. Install Playwright Browsers

```bash
# From repository root
pnpm --filter @mshorizon/tests exec playwright install chromium webkit

# Or install system dependencies on Ubuntu/Debian
pnpm --filter @mshorizon/tests exec playwright install-deps
```

### 2. Start PM2 Dev Server

Ensure the Astro dev server is running:

```bash
pm2 status

# If not running:
PORT=4321 HOST=0.0.0.0 pm2 start npm --name "astro-dev" -- run dev -- -- --host 0.0.0.0 --disable-host-check
```

### 3. Seed the Database

Ensure businesses are in the database:

```bash
cd packages/db
DATABASE_URL="postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db" pnpm run db:seed
```

### 4. Configure Subdomain Resolution (localhost only)

For visual tests to work locally, you need wildcard subdomain resolution.

**Option A: /etc/hosts (simple, manual)**

Add entries for each business:
```bash
sudo nano /etc/hosts

# Add:
127.0.0.1 specialist.localhost
```

**Option B: dnsmasq (automated wildcard)**

```bash
# Install dnsmasq
sudo apt install dnsmasq

# Configure wildcard DNS
echo "address=/.localhost/127.0.0.1" | sudo tee /etc/dnsmasq.d/localhost-wildcard.conf

# Restart
sudo systemctl restart dnsmasq
```

## Running Tests

### Visual Regression Tests

```bash
# Run all visual tests
pnpm test:visual

# Update baseline screenshots (after intentional design changes)
pnpm test:visual:update

# Interactive UI mode (debug)
cd packages/tests
pnpm run test:visual:ui
```

### Template Validation

```bash
# Validate all templates against AJV schema
pnpm run test:validate
```

### Pre-commit Hook

The pre-commit hook automatically validates templates before every commit:

```bash
git commit -m "Update specialist template"
# 🔍 Validating templates against AJV schema...
# ✅ All 1 template(s) valid!
```

To bypass (NOT recommended):
```bash
git commit --no-verify
```

## CI/CD Integration

For production/CI environments:

```bash
# Install browsers in headless mode
pnpm --filter @mshorizon/tests exec playwright install --with-deps chromium

# Run tests with CI reporter
CI=true pnpm test:visual
```

## Troubleshooting

### "No businesses in database" error

```bash
cd packages/db && DATABASE_URL="..." pnpm run db:seed
```

### Subdomain resolution not working

Test with curl:
```bash
curl -v http://specialist.localhost:4321
```

If it fails, check `/etc/hosts` or dnsmasq configuration.

### Screenshot mismatches

1. Check if fonts are loading
2. Verify animations are disabled in tests
3. Ensure consistent viewport sizes
4. Update baselines if design changed intentionally: `pnpm test:visual:update`

### Missing system libraries (WebKit)

```bash
pnpm --filter @mshorizon/tests exec playwright install-deps webkit
```
