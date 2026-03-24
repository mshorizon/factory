#!/usr/bin/env bash
# scripts/claude-session.sh
# Użycie: bash scripts/claude-session.sh <worktree-name> <branch-name> <session-label>
set -e

WORKTREE="$1"
BRANCH="$2"
LABEL="$3"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
WORKTREE_PATH="$REPO_ROOT/.claude/worktrees/$WORKTREE"

# ── 1. Utwórz git worktree jeśli nie istnieje ────────────────────────────────
if [ ! -f "$WORKTREE_PATH/.git" ] && [ ! -d "$WORKTREE_PATH/.git" ]; then
  echo "→ Tworzę git worktree '$WORKTREE'..."
  mkdir -p "$(dirname "$WORKTREE_PATH")"
  git worktree add "$WORKTREE_PATH" -b "$BRANCH" 2>/dev/null \
    || git worktree add "$WORKTREE_PATH" "$BRANCH" 2>/dev/null \
    || { echo "✗ Nie udało się stworzyć worktree"; exit 1; }
  echo "✓ Worktree stworzony: $WORKTREE_PATH"
else
  echo "✓ Worktree już istnieje: $WORKTREE_PATH"
fi

# ── 2. Utwórz CLAUDE.md ──────────────────────────────────────────────────────
cat > "$WORKTREE_PATH/CLAUDE.md" << CLAUDEMD
# Sesja: $LABEL
Worktree: $WORKTREE / Branch: $BRANCH

## Zasady
- Testy: \`pnpm test:validate\`
- Build: \`pnpm build\`

## Aktualny cel
<!-- Claude będzie tu dopisywał postęp -->
CLAUDEMD
echo "✓ CLAUDE.md zapisany"

# ── 3. Uruchom Claude ────────────────────────────────────────────────────────
cd "$WORKTREE_PATH"
exec claude --dangerously-skip-permissions --remote-control "$LABEL"