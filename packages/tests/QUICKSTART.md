# Quick Start Guide

## ✅ Initial Setup (One-time)

### 1. Configure Environment Variables

The `.env` file is already created with database credentials. If you need to change them:

```bash
cd packages/tests
nano .env
```

### 2. Configure Subdomain Resolution

All 10 businesses need subdomain resolution on localhost.

**Option A: Quick (Manual) - Add to `/etc/hosts`:**

```bash
sudo nano /etc/hosts

# Add these lines:
127.0.0.1 wife-art-gallery.localhost
127.0.0.1 wife-cakes.localhost
127.0.0.1 barber.localhost
127.0.0.1 game-selector.localhost
127.0.0.1 honey-worker.localhost
127.0.0.1 zakletewdrewnie.localhost
127.0.0.1 plumber.localhost
127.0.0.1 szater.localhost
127.0.0.1 specialist-old.localhost
127.0.0.1 specialist.localhost
```

**Option B: Automatic (Wildcard DNS) - Using dnsmasq:**

```bash
# Install dnsmasq
sudo apt install dnsmasq

# Configure wildcard for .localhost
echo "address=/.localhost/127.0.0.1" | sudo tee /etc/dnsmasq.d/localhost-wildcard.conf

# Restart dnsmasq
sudo systemctl restart dnsmasq
```

**Verify it works:**
```bash
curl http://specialist.localhost:4321
# Should return HTML, not "Could not resolve host"
```

### 3. Generate Baseline Screenshots

```bash
# From repository root
pnpm test:visual:update
```

This will:
- Navigate to each business subdomain
- Take full-page screenshots
- Save them as baseline images in `packages/tests/src/visual/__screenshots__/`

**Time estimate:** ~2-5 minutes for 10 businesses × 2 browsers × 3 screenshot types

### 4. Commit Baseline Screenshots

```bash
git add packages/tests/src/visual/__screenshots__
git commit -m "Add baseline screenshots for visual regression"
```

## 🚀 Running Tests

### Normal Test Run (Compare against baselines)

```bash
pnpm test:visual
```

### Update Baselines (After intentional design changes)

```bash
pnpm test:visual:update
```

### Debug Mode (Interactive UI)

```bash
cd packages/tests
pnpm run test:visual:ui
```

## 🐛 Troubleshooting

### "Test timeout" or "Could not resolve host"

**Cause:** Subdomain not configured in DNS/hosts

**Fix:**
```bash
# Test the subdomain
curl http://[subdomain].localhost:4321

# If it fails, add to /etc/hosts
echo "127.0.0.1 [subdomain].localhost" | sudo tee -a /etc/hosts
```

### "A snapshot doesn't exist"

**Cause:** First run - baselines not created yet

**Fix:**
```bash
pnpm test:visual:update
```

### "PM2 dev server not running"

**Fix:**
```bash
pm2 status
pm2 restart astro-dev
```

### "DATABASE_URL not set"

**Fix:**
```bash
# Check .env exists
ls packages/tests/.env

# If missing, copy from example
cp packages/tests/.env.example packages/tests/.env
nano packages/tests/.env
```

## 📊 What Gets Tested

For each business (10 total):
- ✅ Full page screenshot (Desktop Chrome 1920x1080)
- ✅ Above-the-fold screenshot (hero section)
- ✅ Admin panel (if exists)
- ✅ Mobile Safari (iPhone 13 viewport)

**Total:** ~60 screenshot comparisons per test run

## 🎯 CI/CD Integration

```yaml
# .github/workflows/visual-tests.yml
- name: Install dependencies
  run: pnpm install

- name: Build packages
  run: pnpm build

- name: Install Playwright
  run: pnpm --filter @mshorizon/tests exec playwright install --with-deps chromium

- name: Run visual tests
  run: CI=true pnpm test:visual
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```
