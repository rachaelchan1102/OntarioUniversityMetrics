/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './pages/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Semantic names backed by the CSS variables in styles/globals.css.
      // `.dark` reassigns the variables, so `bg-card` etc. are theme-aware with
      // no `dark:` variant needed.
      colors: {
        page: 'var(--page)',
        card: 'var(--card)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        soft: 'var(--soft)',
        brand: 'var(--blue)',
        stroke: 'var(--stroke)',
        thead: 'var(--thead)',
      },
      borderColor: {
        DEFAULT: 'var(--line)',
      },
      borderRadius: {
        card: '26px',
        panel: '22px',
        inner: '18px',
        badge: '13px',
      },
      maxWidth: {
        shell: '1120px',
        wide: '1200px',
      },
      letterSpacing: {
        label: '0.14em',
        wordmark: '0.22em',
      },
    },
  },
  plugins: [],
};
