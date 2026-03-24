#!/usr/bin/env bash
# scripts/worktree-sync.sh
# Wywoływany przez hook Stop — commituje zmiany i merguje do main
set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CURRENT_BRANCH="$(git branch --show-current)"
MAIN_BRANCH="main"

# Tylko w worktree (nie w main)
if [ "$CURRENT_BRANCH" = "$MAIN_BRANCH" ]; then
  exit 0
fi

# Czy są jakieś zmiany?
if git diff --quiet && git diff --staged --quiet; then
  exit 0
fi

echo "→ Commituje zmiany w $CURRENT_BRANCH..."
git add .
git commit -m "auto: sync z sesji Claude Code [$(date '+%Y-%m-%d %H:%M')]"

echo "→ Merguje $CURRENT_BRANCH → $MAIN_BRANCH..."
cd "$REPO_ROOT"

# Merge w głównym repo
git -C "$REPO_ROOT" merge "$CURRENT_BRANCH" --no-edit -X theirs

echo "✓ Zsynchronizowano z main"