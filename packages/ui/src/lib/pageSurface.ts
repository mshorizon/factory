import type { CSSProperties } from "react";

/**
 * Re-applies the page (light) theme tokens inside a card that must stay light
 * even when its parent section flips the tokens to the dark palette
 * (section background: "dark"). On light sections this is a no-op because the
 * page-level vars equal the current ones. Mirrors the `data-stats-breakout`
 * mechanism in the engine's BaseLayout.
 */
export const pageSurfaceVars = {
  "--background": "var(--page-background)",
  "--card": "var(--page-card, var(--page-background))",
  "--foreground": "var(--page-foreground)",
  "--muted": "var(--page-muted)",
  "--border": "var(--page-border, color-mix(in srgb, var(--page-foreground) 15%, transparent))",
} as CSSProperties;
