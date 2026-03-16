import type { Theme } from "@mshorizon/schema";

/**
 * Theme Presets
 * Pre-configured theme bundles for different business categories
 */

export type ThemePreset = "industrial" | "wellness" | "minimal" | "bold";

/**
 * Industrial preset - for plumbers, contractors, technical services
 * Blue primary, sharp corners, Inter font
 */
export const industrialPreset: Theme = {
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
    spacing: {
      xs: "0.5rem",
      sm: "0.75rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2rem",
      "2xl": "3rem",
      "3xl": "4rem",
      "section-sm": "5rem",
      section: "10rem",
      container: "2.5rem",
    },
    spacingScale: 1,
    buttonStyle: "solid",
  },
};

/**
 * Wellness preset - for barbers, spas, organic/natural businesses
 * Green primary, soft corners, Nunito + Playfair Display
 */
export const wellnessPreset: Theme = {
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
    spacing: {
      xs: "0.5rem",
      sm: "1rem",
      md: "1.25rem",
      lg: "1.75rem",
      xl: "2.5rem",
      "2xl": "3.5rem",
      "3xl": "5rem",
      "section-sm": "6rem",
      section: "12rem",
      container: "3rem",
    },
    spacingScale: 1,
    buttonStyle: "solid",
  },
};

/**
 * Minimal preset - for modern offices, tech, clean aesthetics
 * Monochrome, minimal radius, system fonts
 */
export const minimalPreset: Theme = {
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
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "0.75rem",
      lg: "1.25rem",
      xl: "1.75rem",
      "2xl": "2.5rem",
      "3xl": "3.5rem",
      "section-sm": "4rem",
      section: "8rem",
      container: "2rem",
    },
    spacingScale: 1,
    buttonStyle: "solid",
  },
};

/**
 * Bold preset - for electricians, contractors, bold trade businesses
 * Yellow primary, dark surface alt, Space Grotesk + Open Sans
 */
export const boldPreset: Theme = {
  preset: "bold",
  mode: "light",
  colors: {
    light: {
      primary: "#FFC633",
      surface: {
        base: "#FFFFFF",
        alt: "#16181D",
      },
      text: {
        main: "#16181D",
        muted: "#8A8A8A",
        onPrimary: "#16181D",
      },
    },
    dark: {
      primary: "#FFC633",
      surface: {
        base: "#16181D",
        alt: "#2D2F34",
      },
      text: {
        main: "#FFFFFF",
        muted: "#9CA3AF",
        onPrimary: "#16181D",
      },
    },
  },
  typography: {
    primary: "'Space Grotesk', system-ui, -apple-system, sans-serif",
    secondary: "'Open Sans', system-ui, -apple-system, sans-serif",
    baseSize: "16px",
  },
  ui: {
    radius: "0.75rem",
    spacing: {
      xs: "0.5rem",
      sm: "0.75rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2rem",
      "2xl": "3rem",
      "3xl": "4rem",
      "section-sm": "5rem",
      section: "10rem",
      container: "2.5rem",
    },
    spacingScale: 1,
    buttonStyle: "solid",
  },
};

/**
 * Map of preset names to their configurations
 */
export const themePresets: Record<ThemePreset, Theme> = {
  industrial: industrialPreset,
  wellness: wellnessPreset,
  minimal: minimalPreset,
  bold: boldPreset,
};

/**
 * Get a preset by name, returns minimal as fallback
 */
export function getPreset(presetName?: string): Theme {
  if (presetName && presetName in themePresets) {
    return themePresets[presetName as ThemePreset];
  }
  return minimalPreset;
}
