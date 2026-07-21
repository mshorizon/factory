// Pure helpers for the Kaizen Growth planner — no DB, no CLI, so they are
// trivially unit-testable (see scripts/goal-planner.test.ts).

import { STEP_TYPES } from "../../packages/db/src/schema.js";
import type { StepType } from "../../packages/db/src/schema.js";

export interface PlannedStep {
  title: string;
  type: StepType;
  rationale: string;
  milestoneLabel: string;
}

export type ValidateResult =
  | { ok: true; value: PlannedStep }
  | { ok: false; errors: string[] };

/**
 * The hardcoded safety baseline. These exclusions are ALWAYS injected into the
 * planner prompt, ahead of any operator-supplied avoid-list, so the tool is
 * safe by default even before the operator configures anything.
 */
export const BASELINE_OFF_LIMITS: string[] = [
  "Cold calling or any unsolicited phone outreach to strangers.",
  "Unsolicited outreach (calls, emails, DMs) that would breach GDPR / EU telemarketing rules.",
  "Anything illegal, or legally risky for a small business.",
];

/** Validate an unknown value as a PlannedStep. Never throws. */
export function validateStep(x: unknown): ValidateResult {
  const errors: string[] = [];
  if (typeof x !== "object" || x === null) {
    return { ok: false, errors: ["step is not an object"] };
  }
  const o = x as Record<string, unknown>;

  if (typeof o.title !== "string" || o.title.trim().length === 0) {
    errors.push("title must be a non-empty string");
  } else if (o.title.length > 120) {
    errors.push("title must be <= 120 chars");
  }

  if (typeof o.type !== "string" || !STEP_TYPES.includes(o.type as StepType)) {
    errors.push(`type must be one of ${STEP_TYPES.join(" | ")}`);
  }

  if (typeof o.rationale !== "string" || o.rationale.trim().length === 0) {
    errors.push("rationale must be a non-empty string");
  }

  if (typeof o.milestoneLabel !== "string" || o.milestoneLabel.trim().length === 0) {
    errors.push("milestoneLabel must be a non-empty string");
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      title: (o.title as string).trim(),
      type: o.type as StepType,
      rationale: (o.rationale as string).trim(),
      milestoneLabel: (o.milestoneLabel as string).trim(),
    },
  };
}

/**
 * Extract a single JSON object from arbitrary model text: strips ```json fences
 * and scans for the first brace-balanced {...} object. Returns the substring or
 * null if none is found.
 */
export function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}
