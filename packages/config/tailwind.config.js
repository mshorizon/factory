/** @type {import('tailwindcss').Config} */
export default {
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
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        background: 'var(--background)',
        card: 'var(--card)',
        foreground: 'var(--foreground)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        border: 'var(--border)',
      },
      borderRadius: {
        radius: 'var(--radius)',
        'radius-secondary': 'var(--radius-secondary)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        heading: 'var(--font-heading)',
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
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-15deg)' },
          '75%': { transform: 'rotate(15deg)' },
        },
      },
      animation: {
        wiggle: 'wiggle 0.5s ease-in-out',
      },
    },
  },
  plugins: [],
};
