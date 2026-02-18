/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    container: {
      center: true,
      padding: '1rem',
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
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        heading: 'var(--font-heading)',
      },
    },
  },
  plugins: [],
};
