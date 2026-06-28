/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: v('--c-bg'),
        panel: v('--c-panel'),
        panel2: v('--c-panel2'),
        border: v('--c-border'),
        muted: v('--c-muted'),
        text: v('--c-text'),
        accent: v('--c-accent'),
        good: v('--c-good'),
        warn: v('--c-warn'),
        cold: v('--c-cold'),
        gen: v('--c-gen'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.35), 0 1px 3px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
};
