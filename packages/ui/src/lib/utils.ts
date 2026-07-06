import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The design-token spacing scale (see CLAUDE.md). tailwind-merge doesn't know
// these custom class names, so without registration it can't tell that e.g.
// CardContent's default "pt-0" conflicts with a caller's "py-spacing-xl" —
// both classes then stay in the list and CSS chunk order (which varies
// between builds) decides the winner. Registering the scale makes cn()
// resolve such conflicts deterministically: the caller's class wins.
const SPACING_TOKENS = [
  "spacing-xs",
  "spacing-sm",
  "spacing-md",
  "spacing-lg",
  "spacing-xl",
  "spacing-2xl",
  "spacing-3xl",
  "spacing-section",
  "spacing-section-sm",
  "spacing-container",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      p: [{ p: SPACING_TOKENS }],
      px: [{ px: SPACING_TOKENS }],
      py: [{ py: SPACING_TOKENS }],
      pt: [{ pt: SPACING_TOKENS }],
      pr: [{ pr: SPACING_TOKENS }],
      pb: [{ pb: SPACING_TOKENS }],
      pl: [{ pl: SPACING_TOKENS }],
      m: [{ m: SPACING_TOKENS }],
      mx: [{ mx: SPACING_TOKENS }],
      my: [{ my: SPACING_TOKENS }],
      mt: [{ mt: SPACING_TOKENS }],
      mr: [{ mr: SPACING_TOKENS }],
      mb: [{ mb: SPACING_TOKENS }],
      ml: [{ ml: SPACING_TOKENS }],
      gap: [{ gap: SPACING_TOKENS }],
      "gap-x": [{ "gap-x": SPACING_TOKENS }],
      "gap-y": [{ "gap-y": SPACING_TOKENS }],
      "space-x": [{ "space-x": SPACING_TOKENS }],
      "space-y": [{ "space-y": SPACING_TOKENS }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
