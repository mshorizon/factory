import type { Theme, ThemeColorMode } from "@mshorizon/schema";
import { getPreset } from "./presets";

/**
 * Deep merge utility for theme objects
 * Recursively merges source into target, with source values taking precedence
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined && source[key] !== null) {
      if (
        typeof source[key] === "object" &&
        !Array.isArray(source[key]) &&
        typeof target[key] === "object" &&
        !Array.isArray(target[key])
      ) {
        // Recursively merge nested objects
        result[key] = deepMerge(target[key], source[key] as Partial<T[Extract<keyof T, string>]>);
      } else {
        // Override with source value
        result[key] = source[key] as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}

/**
 * Deep merge color modes
 */
function mergeColorMode(
  base: ThemeColorMode,
  override?: Partial<ThemeColorMode>
): ThemeColorMode {
  if (!override) return base;
  return deepMerge(base, override);
}

/**
 * Resolve a theme by combining a preset with optional overrides
 *
 * @param presetName - The name of the preset to use (industrial, wellness, minimal)
 * @param overrides - Optional partial theme to override preset values
 * @returns Complete Theme with preset as base and overrides applied
 *
 * @example
 * // Use preset with custom primary color
 * const theme = resolveTheme("wellness", {
 *   colors: { light: { primary: "#8B4513" } }
 * });
 */
export function resolveTheme(
  presetName: string | undefined,
  overrides?: Partial<Theme>
): Theme {
  // Get the base preset
  const basePreset = getPreset(presetName);

  // If no overrides, return the preset as-is
  if (!overrides) {
    return basePreset;
  }

  // Start with base preset, then overlay all overrides so top-level scalar
  // properties (majorTheme, headingWeight, maxFontWeight, navFontSize,
  // navLogoSize, navLogoWeight, navLinksPosition, scrollType, badgeVariant,
  // badgeFontSize, etc.) pass through automatically.
  // Nested objects (colors, typography, ui) are deep-merged below.
  const result: Theme = { ...basePreset, ...overrides };

  // Override mode if specified
  if (overrides.mode) {
    result.mode = overrides.mode;
  }

  // Override globalVariant if specified
  if (overrides.globalVariant) {
    result.globalVariant = overrides.globalVariant;
  }

  // Deep merge colors (presets always define colors)
  if (overrides.colors && basePreset.colors) {
    result.colors = {
      light: mergeColorMode(basePreset.colors.light!, overrides.colors.light),
      dark: overrides.colors.dark || basePreset.colors.dark
        ? mergeColorMode(
            basePreset.colors.dark || basePreset.colors.light!,
            overrides.colors.dark
          )
        : undefined,
    };
  }

  // Deep merge typography (presets always define typography)
  if (overrides.typography && basePreset.typography) {
    result.typography = deepMerge(basePreset.typography, overrides.typography);
  }

  // Deep merge UI settings (presets always define ui)
  if (overrides.ui && basePreset.ui) {
    result.ui = deepMerge(basePreset.ui, overrides.ui);
  }

  // Preserve the preset name from the original preset
  result.preset = basePreset.preset;

  return result;
}
