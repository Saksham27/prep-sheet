/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0d1117',
        panel: '#161b22',
        panel2: '#1c2128',
        border: '#30363d',
        muted: '#8b949e',
        text: '#e6edf3',
        accent: '#58a6ff',
        good: '#3fb950',
        warn: '#d29922',
        cold: '#a371f7',
        gen: '#db6d28',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
