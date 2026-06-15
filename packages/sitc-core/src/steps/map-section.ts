/**
 * mapSection — decide how a target band maps to our engine (DESIGN §6 ladder).
 * Reuse an existing variant, extend one, or create new.
 * v0 prompt — refine + calibrate in Phase 2.
 */
import type { WorkerRunner } from "../types.js";

export interface MapDecision {
  /** Best-matching engine section type, or null if none fits. */
  ourType: string | null;
  /** Recommended existing variant to start from, or null. */
  variant: string | null;
  recommendation: "reuse" | "extend-variant" | "new-variant" | "new-section";
  reason: string;
}

export async function mapSection(
  runner: WorkerRunner,
  targetBandImage: string,
  availableTypes: string[],
  opts: { model?: string } = {},
): Promise<MapDecision> {
  const prompt = `This screenshot is ONE section of a website. Map it to our component system.
Available section types: ${availableTypes.join(", ")}.
Prefer REUSE or EXTEND of an existing type before proposing new code.
Output NOTHING except one JSON object:
{"ourType":"<type|null>","variant":"<variant|null>","recommendation":"reuse"|"extend-variant"|"new-variant"|"new-section","reason":"<short>"}`;
  return runner.runJson<MapDecision>(prompt, {
    images: [targetBandImage],
    allowedTools: ["Read"],
    model: opts.model,
  });
}
