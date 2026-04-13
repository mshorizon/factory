import plugin from 'tailwindcss/plugin';

/**
 * Tailwind v3 compatibility plugin for shadcn/ui v4 components.
 *
 * shadcn/ui components use Tailwind v4 syntax (bare data-* variants,
 * w-(--var), trailing !, etc.). This plugin bridges the gap so those
 * classes generate valid CSS in Tailwind v3.
 */
const shadcnV4Compat = plugin(function ({ addVariant, addUtilities, matchVariant }) {
  // ── Bare data-* custom variants ──────────────────────────
  // TW v4: data-active:bg-red  →  TW v3: needs explicit variant
  const dataVariants = [
    'active', 'open', 'closed', 'checked', 'unchecked',
    'disabled', 'inset',
    'placeholder', 'popup-open', 'ending-style', 'starting-style',
  ];

  // Variants that map to data-orientation or data-state instead of bare attribute
  const aliasVariants = {
    'horizontal': '[data-orientation="horizontal"]',
    'vertical': '[data-orientation="vertical"]',
  };

  for (const name of dataVariants) {
    // data-active: → &[data-active]
    addVariant(`data-${name}`, `&[data-${name}]`);
  }
  for (const [name, selector] of Object.entries(aliasVariants)) {
    addVariant(`data-${name}`, `&${selector}`);
  }

  // Merge all variant names for group/peer usage
  const allVariantNames = [...dataVariants, ...Object.keys(aliasVariants)];

  // ── Helper: get CSS selector for a variant name ────────────
  function selectorFor(name) {
    return aliasVariants[name] || `[data-${name}]`;
  }

  // ── group-data-* variants (with named groups) ────────────
  // TW v4: group-data-horizontal/tabs:flex-col
  for (const name of allVariantNames) {
    const sel = selectorFor(name);
    addVariant(`group-data-${name}`, `:merge(.group)${sel} &`);
    // With named group: group-data-horizontal/tabs → .group\/tabs[data-orientation="horizontal"] &
    matchVariant(
      `group-data-${name}`,
      (value) => `:merge(.group\\/${value})${sel} &`,
      { values: {} }
    );
  }

  // ── peer-data-* variants ─────────────────────────────────
  // TW v4: peer-data-active/menu-button:text-red
  for (const name of allVariantNames) {
    const sel = selectorFor(name);
    addVariant(`peer-data-${name}`, `:merge(.peer)${sel} ~ &`);
    matchVariant(
      `peer-data-${name}`,
      (value) => `:merge(.peer\\/${value})${sel} ~ &`,
      { values: {} }
    );
  }

  // ── has-data-[slot=x] variant ────────────────────────────
  // TW v4: has-data-[slot=card-footer]:pb-0
  matchVariant('has-data', (value) => `&:has([data-${value}])`, { values: {} });

  // ── group-has-data-[x] variant ───────────────────────────
  matchVariant(
    'group-has-data',
    (value, { modifier }) => {
      const groupClass = modifier ? `.group\\/${modifier}` : ':merge(.group)';
      return `${groupClass}:has([data-${value}]) &`;
    },
    { values: {} }
  );

  // ── in-data-[x] (ancestor has data attr) ─────────────────
  matchVariant('in-data', (value) => `[data-${value}] &`, { values: {} });

  // ── not-data-[x] negation ────────────────────────────────
  matchVariant('not-data', (value) => `&:not([data-${value}])`, { values: {} });

  // ── outline-hidden utility (TW v4 only) ──────────────────
  addUtilities({
    '.outline-hidden': {
      outline: '2px solid transparent',
      'outline-offset': '2px',
    },
  });

  // ── supports-backdrop-filter variant ─────────────────────
  addVariant('supports-backdrop-filter', '@supports (backdrop-filter: blur(1px))');
});

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    '../../packages/ui/src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: 'var(--spacing-container)',
      screens: {
        sm: '1200px',
        md: '1200px',
        lg: '1200px',
        xl: '1200px',
        '2xl': '1200px',
      },
    },
    extend: {
      colors: {
        // Shared colors use raw var() — site pages inject hex, admin injects oklch channels.
        // Opacity modifiers (e.g. bg-primary/50) won't work for these, but that's acceptable.
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          light: 'var(--primary-light)',
          dark: 'var(--primary-dark)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        background: 'var(--background)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        foreground: 'var(--foreground)',
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        'on-primary': 'var(--text-on-primary)',
        // Sidebar colors use oklch channels — admin-only, support opacity modifiers.
        sidebar: {
          DEFAULT: 'oklch(var(--sidebar) / <alpha-value>)',
          foreground: 'oklch(var(--sidebar-foreground) / <alpha-value>)',
          primary: {
            DEFAULT: 'oklch(var(--sidebar-primary) / <alpha-value>)',
            foreground: 'oklch(var(--sidebar-primary-foreground) / <alpha-value>)',
          },
          accent: {
            DEFAULT: 'oklch(var(--sidebar-accent) / <alpha-value>)',
            foreground: 'oklch(var(--sidebar-accent-foreground) / <alpha-value>)',
          },
          border: 'oklch(var(--sidebar-border) / <alpha-value>)',
          ring: 'oklch(var(--sidebar-ring) / <alpha-value>)',
        },
      },
      borderRadius: {
        radius: 'var(--radius)',
        'radius-secondary': 'var(--radius-secondary)',
      },
      spacing: {
        'spacing-xs': 'var(--spacing-xs)',
        'spacing-sm': 'var(--spacing-sm)',
        'spacing-md': 'var(--spacing-md)',
        'spacing-lg': 'var(--spacing-lg)',
        'spacing-xl': 'var(--spacing-xl)',
        'spacing-2xl': 'var(--spacing-2xl)',
        'spacing-3xl': 'var(--spacing-3xl)',
        'spacing-section-sm': 'var(--spacing-section-sm)',
        'spacing-section': 'var(--spacing-section)',
        'spacing-container': 'var(--spacing-container)',
      },
      gap: {
        'spacing-xs': 'var(--spacing-xs)',
        'spacing-sm': 'var(--spacing-sm)',
        'spacing-md': 'var(--spacing-md)',
        'spacing-lg': 'var(--spacing-lg)',
        'spacing-xl': 'var(--spacing-xl)',
        'spacing-2xl': 'var(--spacing-2xl)',
        'spacing-3xl': 'var(--spacing-3xl)',
        'spacing-section-sm': 'var(--spacing-section-sm)',
        'spacing-section': 'var(--spacing-section)',
        'spacing-container': 'var(--spacing-container)',
      },
    },
  },
  plugins: [shadcnV4Compat],
};
