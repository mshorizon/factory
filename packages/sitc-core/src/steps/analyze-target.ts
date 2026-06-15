/**
 * analyzeTarget — detect the target's coarse design traits (DESIGN §4.3).
 * Seeds lesson retrieval (§9) and the global theme pass (§5.1).
 * v0 prompt — refine + calibrate in Phase 2.
 */
import type { DesignTraits, WorkerRunner } from "../types.js";

export async function analyzeTarget(
  runner: WorkerRunner,
  screenshots: string[],
  opts: { model?: string } = {},
): Promise<DesignTraits> {
  const prompt = `Analyze the DESIGN LANGUAGE of the website screenshot(s). Report coarse traits only.
Output NOTHING except one JSON object:
{"mode":"light"|"dark","layoutFamily":"<e.g. split|centered|minimal|editorial>","descriptors":["<style adjectives>"],"palette":{"primary":"#hex?","background":"#hex?","accent":"#hex?"},"typographyFeel":"<short>"}`;
  return runner.runJson<DesignTraits>(prompt, {
    images: screenshots,
    allowedTools: ["Read"],
    model: opts.model,
  });
}
