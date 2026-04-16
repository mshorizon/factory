#!/usr/bin/env bash
# run-tasks.sh — Automated Claude Code task processor
#
# Usage:
#   ./scripts/run-tasks.sh            # polls every 60s (default)
#   POLL_INTERVAL=30 ./scripts/run-tasks.sh
#   ./scripts/run-tasks.sh --once     # process one task and exit
#
# Task format in .tasks.md:
#   * [ ] TASK: description of what to do

set -euo pipefail

TASKS_FILE="${TASKS_FILE:-.tasks.md}"
LOG_FILE="scripts/tasks.log"
POLL_INTERVAL="${POLL_INTERVAL:-60}"
ONCE_MODE=false

[[ "${1:-}" == "--once" ]] && ONCE_MODE=true

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
    echo "$msg"
    echo "$msg" >> "$LOG_FILE"
}

notify() {
    osascript -e "display notification \"$1\" with title \"Task Runner\" sound name \"Glass\"" 2>/dev/null || true
}

get_next_task() {
    # Resume interrupted [*] tasks first, then pick next [ ] task
    grep -n "^\* \[\*\]\|^\* \[ \]" "$TASKS_FILE" 2>/dev/null | head -1
}

mark_in_progress() {
    local line_num=$1
    perl -i -pe "s/^\* \[ \]/\* [*]/ if \$. == $line_num" "$TASKS_FILE"
}

mark_done() {
    local line_num=$1
    perl -i -pe "s/^\* \[\*\]/\* [x]/ if \$. == $line_num" "$TASKS_FILE"
}

mark_failed() {
    local line_num=$1
    perl -i -pe "s/^\* \[\*\]/\* [!]/ if \$. == $line_num" "$TASKS_FILE"
}

if [ ! -f "$TASKS_FILE" ]; then
    echo "ERROR: $TASKS_FILE not found. Create it first." >&2
    exit 1
fi

log "Task runner started | file: $TASKS_FILE | poll: ${POLL_INTERVAL}s"
notify "Task runner started"

TASKS_PROCESSED=false

while true; do
    TASK_LINE=$(get_next_task)

    if [ -z "$TASK_LINE" ]; then
        if $TASKS_PROCESSED; then
            log "All tasks done — committing changes..."
            notify "All tasks done. Committing..."
            claude -p "Commit all current changes to git. Write a concise commit message summarising what was done." --dangerously-skip-permissions
            log "Commit done."
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

    LINE_NUM=$(echo "$TASK_LINE" | cut -d: -f1)
    # Strip leading line number and checkbox — keep the task description
    TASK_TEXT=$(echo "$TASK_LINE" | sed 's/^[0-9]*:\* \[.\] //')

    log "→ Picked task (line $LINE_NUM): $TASK_TEXT"
    mark_in_progress "$LINE_NUM"
    notify "Running: $TASK_TEXT"

    # Run claude non-interactively — fresh context per task, CLAUDE.md auto-loaded
    # --dangerously-skip-permissions required: no human present to approve prompts in background mode
    if claude -p "$TASK_TEXT" --dangerously-skip-permissions; then
        mark_done "$LINE_NUM"
        TASKS_PROCESSED=true
        log "✓ Done: $TASK_TEXT"
        notify "Done: $TASK_TEXT"
    else
        EXIT=$?
        mark_failed "$LINE_NUM"
        log "✗ Failed (exit $EXIT): $TASK_TEXT — marked [!], continuing..."
        notify "Failed: $TASK_TEXT"
    fi

    if $ONCE_MODE; then
        log "Exiting after one task (--once mode)."
        exit 0
    fi

    # Short pause between tasks to avoid hammering the API
    sleep 5
done
