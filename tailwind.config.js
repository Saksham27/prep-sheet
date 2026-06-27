/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0a0c10',
        panel: '#13161d',
        panel2: '#1b1f28',
        border: '#2a2f3a',
        muted: '#929cad',
        text: '#e8edf4',
        accent: '#6cb1ff',
        good: '#3fb950',
        warn: '#d9a531',
        cold: '#a371f7',
        gen: '#e0833f',
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
