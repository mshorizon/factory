/**
 * Multi-breakpoint scoring + mobile guard (tasks I12 / CONCLUSIONS #8, DESIGN §4.3/§5.2).
 *
 * The loop optimizes DESKTOP; mobile was captured but never consulted, so a
 * challenger that wins desktop while breaking mobile (horizontal overflow, collapsed
 * layout) was promoted and only maybe caught at the final acceptance gate. §5.2 step 6
 * describes a mobile GUARD ("a challenger that improves desktop but tanks mobile below
 * a floor is rejected") that was never implemented — this is it, plus the pure
 * primitive to later score both breakpoints with weighted scores.
 */
import type { Breakpoint } from "../types.js";

/** Mobile as a SCORED target (vs the guard-only MOBILE_GUARD) — for weighted scoring. */
export const MOBILE_SCORE: Breakpoint = { label: "mobile", width: 390, height: 844, role: "score" };

export interface BreakpointScore {
  label: string;
  role: "score" | "guard";
  score: number; // 0..1
  weight?: number;
}

/**
 * Weighted combine over the "score"-role breakpoints (guards excluded — they gate,
 * they don't average). Default weight 1 each. Returns 0 if nothing is scored.
 */
export function combineBreakpointScores(entries: BreakpointScore[]): number {
  const scored = entries.filter((e) => e.role === "score");
  const totW = scored.reduce((s, e) => s + (e.weight ?? 1), 0);
  if (totW <= 0) return 0;
  return scored.reduce((s, e) => s + e.score * (e.weight ?? 1), 0) / totW;
}

export interface MobileGuardInput {
  /** Champion's mobile horizontal overflow (px). */
  championOverflowPx: number;
  /** Challenger's mobile horizontal overflow (px). */
  challengerOverflowPx: number;
  /** Tolerance — small overflows are sub-pixel/scrollbar noise. Default 2px. */
  floorPx?: number;
}

export interface GuardVerdict {
  ok: boolean;
  reason?: string;
}

/**
 * The §5.2-step-6 guard: reject a desktop-winning challenger if it INTRODUCES (or
 * materially worsens) mobile horizontal overflow vs the champion. A challenger whose
 * mobile is equal-or-better than the champion's passes — we never block on a problem
 * the champion already had.
 */
export function mobileGuardVerdict(i: MobileGuardInput): GuardVerdict {
  const floor = i.floorPx ?? 2;
  if (i.challengerOverflowPx > floor && i.challengerOverflowPx > i.championOverflowPx + floor) {
    return { ok: false, reason: `mobile h-overflow ${i.challengerOverflowPx}px (champion ${i.championOverflowPx}px) — fix responsive layout` };
  }
  return { ok: true };
}
