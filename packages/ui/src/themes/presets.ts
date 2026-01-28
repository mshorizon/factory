import type { ThemeV15 } from "@mshorizon/schema";

/**
 * Theme Presets
 * Pre-configured theme bundles for different business categories
 */

export type ThemePreset = "industrial" | "wellness" | "minimal";

/**
 * Industrial preset - for plumbers, contractors, technical services
 * Blue primary, sharp corners, Inter font
 */
export const industrialPreset: ThemeV15 = {
  preset: "industrial",
  mode: "light",
  colors: {
    light: {
      primary: "#0066CC",
      surface: {
        base: "#F8FAFC",
        alt: "#003D7A",
      },
      text: {
        main: "#0F172A",
        muted: "#64748B",
        onPrimary: "#FFFFFF",
      },
    },
    dark: {
      primary: "#3B82F6",
      surface: {
        base: "#0F172A",
        alt: "#1E3A5F",
      },
      text: {
        main: "#F8FAFC",
        muted: "#94A3B8",
        onPrimary: "#FFFFFF",
      },
    },
  },
  typography: {
    primary: "'Inter', system-ui, -apple-system, sans-serif",
    secondary: "'Inter', system-ui, -apple-system, sans-serif",
    baseSize: "16px",
  },
  ui: {
    radius: "0.5rem",
    spacingScale: 1,
    buttonStyle: "solid",
  },
};

/**
 * Wellness preset - for barbers, spas, organic/natural businesses
 * Green primary, soft corners, Nunito + Playfair Display
 */
export const wellnessPreset: ThemeV15 = {
  preset: "wellness",
  mode: "light",
  colors: {
    light: {
      primary: "#10B981",
      surface: {
        base: "#F0FDF4",
        alt: "#065F46",
      },
      text: {
        main: "#022C22",
        muted: "#6B7280",
        onPrimary: "#FFFFFF",
      },
    },
    dark: {
      primary: "#34D399",
      surface: {
        base: "#022C22",
        alt: "#065F46",
      },
      text: {
        main: "#ECFDF5",
        muted: "#9CA3AF",
        onPrimary: "#022C22",
      },
    },
  },
  typography: {
    primary: "'Nunito', system-ui, -apple-system, sans-serif",
    secondary: "'Playfair Display', Georgia, serif",
    baseSize: "16px",
  },
  ui: {
    radius: "1rem",
    spacingScale: 1,
    buttonStyle: "solid",
  },
};

/**
 * Minimal preset - for modern offices, tech, clean aesthetics
 * Monochrome, minimal radius, system fonts
 */
export const minimalPreset: ThemeV15 = {
  preset: "minimal",
  mode: "light",
  colors: {
    light: {
      primary: "#18181B",
      surface: {
        base: "#FFFFFF",
        alt: "#27272A",
      },
      text: {
        main: "#18181B",
        muted: "#71717A",
        onPrimary: "#FFFFFF",
      },
    },
    dark: {
      primary: "#FAFAFA",
      surface: {
        base: "#18181B",
        alt: "#3F3F46",
      },
      text: {
        main: "#FAFAFA",
        muted: "#A1A1AA",
        onPrimary: "#18181B",
      },
    },
  },
  typography: {
    primary: "system-ui, -apple-system, sans-serif",
    secondary: "system-ui, -apple-system, sans-serif",
    baseSize: "16px",
  },
  ui: {
    radius: "0.25rem",
    spacingScale: 1,
    buttonStyle: "solid",
  },
};

/**
 * Map of preset names to their configurations
 */
export const themePresets: Record<ThemePreset, ThemeV15> = {
  industrial: industrialPreset,
  wellness: wellnessPreset,
  minimal: minimalPreset,
};

/**
 * Get a preset by name, returns minimal as fallback
 */
export function getPreset(presetName?: string): ThemeV15 {
  if (presetName && presetName in themePresets) {
    return themePresets[presetName as ThemePreset];
  }
  return minimalPreset;
}
