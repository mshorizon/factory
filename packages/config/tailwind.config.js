/** @type {import('tailwindcss').Config} */
export default {
  theme: {
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
