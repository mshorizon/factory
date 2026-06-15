/**
 * Phase A — global theme pass (DESIGN §5.1).
 *
 * Global `theme.*` tokens (palette, typography, radius) are shared by every
 * section, so they're resolved FIRST and locked — otherwise a per-section worker
 * shifting `primary` would move every other section's score and break the
 * per-section independence the loop relies on.
 *
 * Proposes tokens from the target, merges them into the profile (preserving
 * preset/majorTheme/spacing scale), and keeps the result schema-valid. The
 * convergence loop is capped (`maxIterations`, default 1) for cost; the structure
 * supports score-driven iteration via the injected scorer.
 */
import type { BusinessProfile, DesignTraits, WorkerRunner } from "../types.js";
import { analyzeTarget } from "../steps/analyze-target.js";
import { validateProfile } from "../steps/validate.js";

export interface ProposedTheme {
  mode: "light" | "dark";
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  typography: { primary: string; secondary: string };
  radius: string;
}

interface ThemeColors {
  primary: string;
  primaryLight?: string;
  primaryDark?: string;
  surface: { base: string; alt: string; card: string };
  text: { main: string; muted: string; onPrimary: string };
}

export interface LockGlobalThemeInput {
  runner: WorkerRunner;
  profile: BusinessProfile;
  /** Frozen target screenshot paths (the goal). */
  targetScreenshots: string[];
  traits?: DesignTraits;
  model?: string;
}

export interface LockGlobalThemeResult {
  profile: BusinessProfile;
  theme: ProposedTheme;
  traits: DesignTraits;
}

async function proposeTheme(
  runner: WorkerRunner,
  screenshots: string[],
  traits: DesignTraits,
  model?: string,
): Promise<ProposedTheme> {
  const prompt = `From the website screenshot(s), propose the global THEME tokens for our rendering engine.
Detected traits: ${JSON.stringify(traits)}.
Fill BOTH light and dark palettes (hex), font stacks, and the card/button corner radius.
Output NOTHING except one JSON object:
{"mode":"light"|"dark",
 "colors":{"light":{"primary":"#hex","primaryLight":"#hex","primaryDark":"#hex","surface":{"base":"#hex","alt":"#hex","card":"#hex"},"text":{"main":"#hex","muted":"#hex","onPrimary":"#hex"}},
           "dark":{"primary":"#hex","primaryLight":"#hex","primaryDark":"#hex","surface":{"base":"#hex","alt":"#hex","card":"#hex"},"text":{"main":"#hex","muted":"#hex","onPrimary":"#hex"}}},
 "typography":{"primary":"'Font', system-ui, sans-serif","secondary":"'Font', system-ui, sans-serif"},
 "radius":"<e.g. 8px|16px|9999px>"}`;
  return runner.runJson<ProposedTheme>(prompt, { images: screenshots, allowedTools: ["Read"], model });
}

/** Merge proposed tokens into the profile theme, preserving preset/majorTheme/spacing. */
function applyTheme(profile: BusinessProfile, t: ProposedTheme): BusinessProfile {
  const next = structuredClone(profile) as any;
  const theme = (next.theme = next.theme ?? {});
  theme.mode = t.mode;
  theme.colors = { ...(theme.colors ?? {}), light: t.colors.light, dark: t.colors.dark };
  theme.typography = { ...(theme.typography ?? {}), ...t.typography };
  theme.ui = { ...(theme.ui ?? {}), radius: t.radius };
  return next as BusinessProfile;
}

export async function lockGlobalTheme(
  input: LockGlobalThemeInput & { maxIterations?: number },
): Promise<LockGlobalThemeResult> {
  const traits = input.traits ?? (await analyzeTarget(input.runner, input.targetScreenshots, { model: input.model }));
  const theme = await proposeTheme(input.runner, input.targetScreenshots, traits, input.model);
  const candidate = applyTheme(input.profile, theme);

  // Keep the lock schema-valid: only adopt if it doesn't break validation.
  const before = validateProfile(input.profile);
  const after = validateProfile(candidate);
  const profile = !after.valid && before.valid ? input.profile : candidate;

  return { profile, theme, traits };
}
