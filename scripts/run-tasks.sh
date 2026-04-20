#!/usr/bin/env bash
# run-tasks.sh — Automated Claude Code task processor (DB-backed)
#
# Usage:
#   ./scripts/run-tasks.sh            # polls every 60s (default)
#   POLL_INTERVAL=30 ./scripts/run-tasks.sh
#   ./scripts/run-tasks.sh --once     # process one task and exit

set -euo pipefail

POLL_INTERVAL="${POLL_INTERVAL:-60}"
ONCE_MODE=false
LOG_FILE="scripts/tasks.log"
TASK_DB="tsx scripts/task-db.ts"

[[ "${1:-}" == "--once" ]] && ONCE_MODE=true

export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db}"

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
    echo "$msg"
    echo "$msg" >> "$LOG_FILE"
}

notify() {
    osascript -e "display notification \"$1\" with title \"Task Runner\" sound name \"Glass\"" 2>/dev/null || true
}

# ── Build prompt for claude -p ─────────────────────────────────────────────
build_prompt() {
    local domain="$1" template="$2" page="$3" section="$4" is_admin="$5" description="$6"

    local target
    if [[ "$is_admin" == "true" ]]; then
        target="Admin panel"
        [[ -n "$page" ]]    && target+=" › group: $page"
        [[ -n "$section" ]] && target+=" › tab: $section"
    else
        target="Site page: /$page"
        [[ -n "$section" ]] && target+=" › section: $section"
    fi

    cat <<PROMPT
You are executing a task from the admin Task Manager queue in the Hazelgrouse Studio factory repo.

CONTEXT:
  Domain:   $domain
  Template: $template
  Target:   $target

TASK:
$description

INSTRUCTIONS:
1. Complete the task as described. Follow all rules in CLAUDE.md strictly.
2. If the task is completely clear, do the work and output a brief summary of what you did.
3. If you CANNOT proceed without clarification, output EXACTLY this (and nothing else):
   QUESTION: <your question here>
   Do NOT ask and also do partial work — either fully complete or ask.
4. After completing: stage your changes (git add) but do NOT commit. The runner commits separately.
PROMPT
}

# ── Main loop ─────────────────────────────────────────────────────────────
log "Task runner started | poll: ${POLL_INTERVAL}s"
notify "Task runner started"

TASKS_PROCESSED=false

while true; do
    # ── Get oldest pending task from DB ───────────────────────────────────
    TASK_JSON=$(cd /home/dev/factory && $TASK_DB get-pending 2>/dev/null || true)

    if [[ -z "$TASK_JSON" ]]; then
        if $TASKS_PROCESSED; then
            log "All tasks done — committing changes..."
            notify "All tasks done. Committing..."
            cd /home/dev/factory
            claude -p "Commit all staged changes to git. Write a concise conventional commit message summarising what was done across all completed tasks. Do NOT push." \
                --dangerously-skip-permissions 2>&1 | tee -a "$LOG_FILE" || true
            log "Commit step done."
            notify "Commit done"
            TASKS_PROCESSED=false
        fi

        if $ONCE_MODE; then
            log "No pending tasks. Exiting (--once mode)."
            exit 0
        fi
        log "No pending tasks. Next check in ${POLL_INTERVAL}s..."
        sleep "$POLL_INTERVAL"
        continue
    fi

    # ── Parse task fields ─────────────────────────────────────────────────
    TASK_ID=$(echo "$TASK_JSON"      | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['id'])")
    DOMAIN=$(echo "$TASK_JSON"       | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['domain'])")
    TEMPLATE=$(echo "$TASK_JSON"     | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['template'])")
    PAGE=$(echo "$TASK_JSON"         | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('page') or '')")
    SECTION=$(echo "$TASK_JSON"      | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('section') or '')")
    IS_ADMIN=$(echo "$TASK_JSON"     | python3 -c "import sys,json; d=json.load(sys.stdin); print(str(d.get('isAdminPanel', False)).lower())")
    DESCRIPTION=$(echo "$TASK_JSON"  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['description'])")

    log "→ Task $TASK_ID | $DOMAIN / $TEMPLATE / ${PAGE}${SECTION:+#$SECTION}"
    log "  $DESCRIPTION"

    # ── Mark in-progress ──────────────────────────────────────────────────
    (cd /home/dev/factory && $TASK_DB set-status "$TASK_ID" "in-progress") 2>&1 | tee -a "$LOG_FILE" || true

    # ── Build & run prompt ────────────────────────────────────────────────
    PROMPT=$(build_prompt "$DOMAIN" "$TEMPLATE" "$PAGE" "$SECTION" "$IS_ADMIN" "$DESCRIPTION")
    TMPOUT=$(mktemp)

    notify "Running: ${DESCRIPTION:0:60}..."

    set +e
    (cd /home/dev/factory && claude -p "$PROMPT" --dangerously-skip-permissions) 2>&1 | tee "$TMPOUT" | tee -a "$LOG_FILE"
    CLAUDE_EXIT=${PIPESTATUS[0]}
    set -e

    OUTPUT=$(cat "$TMPOUT")
    rm -f "$TMPOUT"

    # ── Detect QUESTION: marker ────────────────────────────────────────────
    if echo "$OUTPUT" | grep -qE "^QUESTION:"; then
        QUESTION=$(echo "$OUTPUT" | grep -E "^QUESTION:" | sed 's/^QUESTION:[[:space:]]*//' | head -1)
        log "⏸ Task $TASK_ID on hold — Claude asks: $QUESTION"
        notify "On hold: ${QUESTION:0:80}"
        echo "$QUESTION" | (cd /home/dev/factory && $TASK_DB set-on-hold "$TASK_ID") 2>&1 | tee -a "$LOG_FILE" || {
            log "✗ Failed to set on_hold for $TASK_ID"
        }
    elif [[ $CLAUDE_EXIT -eq 0 ]]; then
        (cd /home/dev/factory && $TASK_DB set-status "$TASK_ID" "done") 2>&1 | tee -a "$LOG_FILE" || true
        TASKS_PROCESSED=true
        log "✓ Done: $TASK_ID"
        notify "Done: ${DESCRIPTION:0:60}"
    else
        (cd /home/dev/factory && $TASK_DB set-status "$TASK_ID" "failed") 2>&1 | tee -a "$LOG_FILE" || true
        log "✗ Failed (exit $CLAUDE_EXIT): $TASK_ID"
        notify "Failed: ${DESCRIPTION:0:60}"
    fi

    if $ONCE_MODE; then
        log "Exiting after one task (--once mode)."
        exit 0
    fi

    sleep 5
done
