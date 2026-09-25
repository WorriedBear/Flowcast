/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)', action: 'var(--action)', cash: 'var(--cash)', risk: 'var(--risk)',
        fx: 'var(--fx)', ai: 'var(--ai)', paper: 'var(--paper)', surface: 'var(--surface)',
        rule: 'var(--rule)', muted: 'var(--muted)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: { xs: ['12px', '16px'], sm: ['14px', '20px'], base: ['16px', '24px'], lg: ['20px', '28px'], xl: ['28px', '34px'], '2xl': ['40px', '46px'] },
      borderRadius: { panel: '10px', ctl: '6px' },
    },
  },
  plugins: [],
};
