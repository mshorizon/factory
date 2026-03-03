#!/bin/bash
# Setup subdomain resolution for all businesses in database

set -e

echo "======================================"
echo "Subdomain DNS Setup"
echo "======================================"
echo ""

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
  echo "❌ This script must be run with sudo"
  echo "   Usage: sudo ./scripts/setup-hosts.sh"
  exit 1
fi

# Fetch all subdomains from database
echo "Fetching businesses from database..."
cd "$(dirname "$0")/../../db"
SUBDOMAINS=$(DATABASE_URL="${DATABASE_URL}" pnpm exec tsx -e "import { getAllSubdomains } from './dist/index.js'; getAllSubdomains().then(s => console.log(s.join(' ')))" 2>/dev/null)

if [ -z "$SUBDOMAINS" ]; then
  echo "❌ Failed to fetch subdomains from database"
  echo "   Make sure DATABASE_URL is set and database is seeded"
  exit 1
fi

echo "Found businesses: $SUBDOMAINS"
echo ""

# Backup /etc/hosts
cp /etc/hosts /etc/hosts.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backed up /etc/hosts"
echo ""

# Add entries to /etc/hosts
echo "Adding subdomain entries to /etc/hosts..."
for subdomain in $SUBDOMAINS; do
  # Check if entry already exists
  if grep -q "$subdomain.localhost" /etc/hosts; then
    echo "  ⏭️  $subdomain.localhost already exists"
  else
    echo "127.0.0.1 $subdomain.localhost" >> /etc/hosts
    echo "  ✅ Added $subdomain.localhost"
  fi
done

echo ""
echo "======================================"
echo "✅ Setup complete!"
echo "======================================"
echo ""
echo "Test subdomain resolution:"
echo "  curl http://specialist.localhost:4321"
echo ""
echo "To undo, restore backup:"
echo "  sudo cp /etc/hosts.backup.* /etc/hosts"
echo ""
