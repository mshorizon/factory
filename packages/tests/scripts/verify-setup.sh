#!/bin/bash
set -e

echo "======================================"
echo "Visual Testing Setup Verification"
echo "======================================"
echo ""

# Check PM2 status
echo "1. Checking PM2 dev server..."
if pm2 list | grep -q "astro-dev.*online"; then
  echo "   ✅ PM2 dev server is running"
else
  echo "   ❌ PM2 dev server is NOT running"
  echo "      Run: pm2 start npm --name astro-dev -- run dev"
  exit 1
fi
echo ""

# Check if port 4321 is listening
echo "2. Checking if port 4321 is listening..."
if lsof -i :4321 >/dev/null 2>&1 || ss -tuln | grep -q ':4321 '; then
  echo "   ✅ Port 4321 is listening"
else
  echo "   ❌ Port 4321 is NOT listening"
  exit 1
fi
echo ""

# Check database connection
echo "3. Checking database connection..."
cd "$(dirname "$0")/../../db"
if DATABASE_URL="${DATABASE_URL}" pnpm exec tsx -e "import { getAllSubdomains } from './dist/index.js'; getAllSubdomains().then(s => console.log('   Found', s.length, 'business(es)'))" 2>&1 | grep -q "Found"; then
  echo "   ✅ Database connection successful"
else
  echo "   ⚠️  Database connection issue (may need seeding)"
  echo "      Run: cd packages/db && DATABASE_URL='...' pnpm run db:seed"
fi
echo ""

# Check Playwright browsers
echo "4. Checking Playwright browsers..."
cd "$(dirname "$0")/.."
if [ -d "$HOME/.cache/ms-playwright/chromium"* ]; then
  echo "   ✅ Playwright Chromium installed"
else
  echo "   ⚠️  Playwright browsers not installed"
  echo "      Run: pnpm --filter @mshorizon/tests exec playwright install chromium"
fi
echo ""

echo "======================================"
echo "✅ Setup verification complete!"
echo "======================================"
echo ""
echo "Run visual tests with:"
echo "  pnpm test:visual"
echo ""
