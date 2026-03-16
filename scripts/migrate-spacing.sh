#!/bin/bash

# Spacing Design Tokens Migration Script
# Migrates hardcoded Tailwind spacing classes to design tokens
# Usage: bash scripts/migrate-spacing.sh

set -e

echo "🚀 Starting spacing migration..."

# Target directories
TARGETS=(
  "apps/engine/src/components/sections"
  "packages/ui/src/atoms"
  "packages/ui/src/sections"
)

# Function to perform replacements in a file
migrate_file() {
  local file=$1

  # Section vertical padding
  sed -i 's/\bpy-40\b/py-spacing-section/g' "$file"
  sed -i 's/\bpy-20\b/py-spacing-section/g' "$file"
  sed -i 's/\bpy-16\b/py-spacing-3xl/g' "$file"
  sed -i 's/\bpy-12\b/py-spacing-3xl/g' "$file"
  sed -i 's/\bpy-8\b/py-spacing-2xl/g' "$file"
  sed -i 's/\bpy-6\b/py-spacing-lg/g' "$file"
  sed -i 's/\bpy-4\b/py-spacing-md/g' "$file"
  sed -i 's/\bpy-2\b/py-spacing-sm/g' "$file"

  # Horizontal padding
  sed -i 's/\bpx-16\b/px-spacing-3xl/g' "$file"
  sed -i 's/\bpx-12\b/px-spacing-3xl/g' "$file"
  sed -i 's/\bpx-8\b/px-spacing-2xl/g' "$file"
  sed -i 's/\bpx-6\b/px-spacing-lg/g' "$file"
  sed -i 's/\bpx-4\b/px-spacing-md/g' "$file"

  # All-side padding
  sed -i 's/\bp-12\b/p-spacing-3xl/g' "$file"
  sed -i 's/\bp-8\b/p-spacing-2xl/g' "$file"
  sed -i 's/\bp-6\b/p-spacing-lg/g' "$file"
  sed -i 's/\bp-4\b/p-spacing-md/g' "$file"

  # Gap (flexbox/grid)
  sed -i 's/\bgap-12\b/gap-spacing-3xl/g' "$file"
  sed -i 's/\bgap-8\b/gap-spacing-2xl/g' "$file"
  sed -i 's/\bgap-6\b/gap-spacing-lg/g' "$file"
  sed -i 's/\bgap-4\b/gap-spacing-md/g' "$file"
  sed -i 's/\bgap-3\b/gap-spacing-sm/g' "$file"
  sed -i 's/\bgap-2\b/gap-spacing-xs/g' "$file"

  # Margin bottom
  sed -i 's/\bmb-12\b/mb-spacing-3xl/g' "$file"
  sed -i 's/\bmb-8\b/mb-spacing-2xl/g' "$file"
  sed -i 's/\bmb-6\b/mb-spacing-lg/g' "$file"
  sed -i 's/\bmb-4\b/mb-spacing-md/g' "$file"
  sed -i 's/\bmb-2\b/mb-spacing-xs/g' "$file"

  # Margin top
  sed -i 's/\bmt-12\b/mt-spacing-3xl/g' "$file"
  sed -i 's/\bmt-8\b/mt-spacing-2xl/g' "$file"
  sed -i 's/\bmt-6\b/mt-spacing-lg/g' "$file"
  sed -i 's/\bmt-4\b/mt-spacing-md/g' "$file"

  # Space between (flexbox)
  sed -i 's/\bspace-y-12\b/space-y-spacing-3xl/g' "$file"
  sed -i 's/\bspace-y-8\b/space-y-spacing-2xl/g' "$file"
  sed -i 's/\bspace-y-6\b/space-y-spacing-lg/g' "$file"
  sed -i 's/\bspace-y-4\b/space-y-spacing-md/g' "$file"
  sed -i 's/\bspace-y-2\b/space-y-spacing-xs/g' "$file"

  sed -i 's/\bspace-x-12\b/space-x-spacing-3xl/g' "$file"
  sed -i 's/\bspace-x-8\b/space-x-spacing-2xl/g' "$file"
  sed -i 's/\bspace-x-6\b/space-x-spacing-lg/g' "$file"
  sed -i 's/\bspace-x-4\b/space-x-spacing-md/g' "$file"
  sed -i 's/\bspace-x-2\b/space-x-spacing-xs/g' "$file"

  echo "  ✓ Migrated: $file"
}

# Count total files
total_files=0
for target in "${TARGETS[@]}"; do
  if [ -d "$target" ]; then
    count=$(find "$target" -type f \( -name "*.tsx" -o -name "*.astro" \) | wc -l)
    total_files=$((total_files + count))
  fi
done

echo "📁 Found $total_files files to migrate"
echo ""

# Process all files
migrated=0
for target in "${TARGETS[@]}"; do
  if [ -d "$target" ]; then
    echo "📂 Processing: $target"
    while IFS= read -r -d '' file; do
      migrate_file "$file"
      migrated=$((migrated + 1))
    done < <(find "$target" -type f \( -name "*.tsx" -o -name "*.astro" \) -print0)
    echo ""
  else
    echo "⚠️  Directory not found: $target"
  fi
done

echo "✅ Migration complete!"
echo "   Migrated $migrated files"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff"
echo "2. Test on dev server: pm2 restart astro-dev"
echo "3. Check for any issues in browser"
echo "4. Commit if everything looks good"
