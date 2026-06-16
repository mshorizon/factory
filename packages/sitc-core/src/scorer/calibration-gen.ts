/**
 * Subtle calibration-triple generator (DESIGN §7.2a, spike caveat #1).
 *
 * The spike proved the judge on GROSS cross-template differences. The real loop
 * compares a champion to a slightly-different challenger, so we must prove the
 * judge on SUBTLE deltas. This generates ground-truthed subtle triples by
 * rendering the SAME section at controlled perturbation magnitudes: target =
 * pristine (magnitude 0), "near" = small delta, "far" = larger delta. Since a
 * smaller perturbation is objectively closer to the pristine target, ground
 * truth is known without a human. Each perturbation yields TWO triples (champion
 * = near and champion = far) so the set also probes order independence.
 *
 * Pure orchestration over an injected `render` — testable with a fake renderer.
 */
import type { CalibrationTriple } from "./calibration.js";

export interface PerturbationSpec {
  label: string;
  /** Mutate a profile CLONE by the given magnitude (0 = pristine/target). */
  apply: (profile: Record<string, unknown>, magnitude: number) => void;
  /** [nearMagnitude, farMagnitude] — near is closer to the pristine target. */
  levels: [number, number];
}

export interface GenerateTriplesOptions {
  baseProfile: Record<string, unknown>;
  /** Render a profile to an image file; label disambiguates the output path. */
  render: (profile: Record<string, unknown>, label: string) => Promise<string>;
  perturbations: PerturbationSpec[];
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

export async function generateSubtleTriples(opts: GenerateTriplesOptions): Promise<CalibrationTriple[]> {
  const triples: CalibrationTriple[] = [];
  for (const spec of opts.perturbations) {
    const [near, far] = spec.levels;
    const targetImg = await opts.render(clone(opts.baseProfile), `${spec.label}-target`);

    const nearProfile = clone(opts.baseProfile);
    spec.apply(nearProfile, near);
    const nearImg = await opts.render(nearProfile, `${spec.label}-near`);

    const farProfile = clone(opts.baseProfile);
    spec.apply(farProfile, far);
    const farImg = await opts.render(farProfile, `${spec.label}-far`);

    // near is closer to target than far → ground truth is whichever slot holds near.
    triples.push({ id: `${spec.label}-near-champ`, championImg: nearImg, challengerImg: farImg, targetImg, human: "champion" });
    triples.push({ id: `${spec.label}-near-chall`, championImg: farImg, challengerImg: nearImg, targetImg, human: "challenger" });
  }
  return triples;
}

// ─── perturbation helpers ─────────────────────────────────────────────────────

/** Shift a #RRGGBB hex by `delta` on each channel (clamped). */
export function shiftHex(hex: string, delta: number): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.max(0, Math.min(255, c + delta)));
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** Read/write a nested value by dotted path (e.g. "theme.colors.light.primary"). */
function getPath(obj: any, path: string): any {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}
function setPath(obj: any, path: string, value: unknown): void {
  const keys = path.split(".");
  const last = keys.pop()!;
  const parent = keys.reduce((o, k) => (o[k] ??= {}), obj);
  parent[last] = value;
}

/** Perturb a hex-color token at `path` by `magnitude` units per channel. */
export function colorPerturbation(label: string, path: string, levels: [number, number]): PerturbationSpec {
  return {
    label,
    levels,
    apply: (profile, magnitude) => {
      const cur = getPath(profile, path);
      if (typeof cur === "string") setPath(profile, path, shiftHex(cur, magnitude));
    },
  };
}

/** Perturb a px token at `path` (e.g. "theme.ui.radius") by `magnitude` px. */
export function pxPerturbation(label: string, path: string, levels: [number, number]): PerturbationSpec {
  return {
    label,
    levels,
    apply: (profile, magnitude) => {
      const cur = getPath(profile, path);
      const base = typeof cur === "string" ? parseFloat(cur) : typeof cur === "number" ? cur : NaN;
      if (Number.isFinite(base)) setPath(profile, path, `${Math.max(0, base + magnitude)}px`);
    },
  };
}
