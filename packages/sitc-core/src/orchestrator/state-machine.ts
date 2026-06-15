/**
 * Run state machine (DESIGN §8).
 *
 * Pure transition logic — no DB, no IO — so it's deterministic and unit-tested.
 * `idle → running → (awaiting_approval ⇄ running) → (paused ⇄ running) →
 *  (done | needs_review | aborted)`; `needs_review` can still resolve to
 * `done` (human Approve & merge, §11) or `aborted`.
 */
export const RUN_STATUSES = [
  "idle",
  "running",
  "awaiting_approval",
  "paused",
  "done",
  "needs_review",
  "aborted",
] as const;

export type RunStatus = (typeof RUN_STATUSES)[number];

export const TERMINAL_STATUSES: readonly RunStatus[] = ["done", "aborted"];

/** Allowed direct transitions per status. */
const TRANSITIONS: Record<RunStatus, readonly RunStatus[]> = {
  idle: ["running", "aborted"],
  running: ["awaiting_approval", "paused", "done", "needs_review", "aborted"],
  awaiting_approval: ["running", "aborted"],
  paused: ["running", "aborted"],
  // needs_review is a hold state: a human approves the merge (→ done) or aborts.
  needs_review: ["done", "aborted"],
  done: [],
  aborted: [],
};

export function isTerminal(status: RunStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function canTransition(from: RunStatus, to: RunStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: RunStatus, to: RunStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`illegal run transition: ${from} → ${to}`);
  }
}

/** Control events a human/command can raise, mapped to target statuses. */
export type RunEvent =
  | "start"
  | "checkpoint"
  | "approve" // resume from awaiting_approval
  | "pause"
  | "resume"
  | "complete_clean"
  | "complete_review"
  | "approve_merge" // needs_review → done
  | "abort"
  | "fail";

const EVENT_TARGET: Record<RunEvent, RunStatus> = {
  start: "running",
  checkpoint: "awaiting_approval",
  approve: "running",
  pause: "paused",
  resume: "running",
  complete_clean: "done",
  complete_review: "needs_review",
  approve_merge: "done",
  abort: "aborted",
  fail: "needs_review",
};

/** Apply an event, returning the next status. Throws if illegal from `current`. */
export function applyEvent(current: RunStatus, event: RunEvent): RunStatus {
  const target = EVENT_TARGET[event];
  assertTransition(current, target);
  return target;
}
