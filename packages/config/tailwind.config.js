/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    container: {
      center: true,
      padding: '2.5rem',
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
