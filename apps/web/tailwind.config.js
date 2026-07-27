/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Design system: a civic ledger, not a SaaS dashboard. Cool paper
      // instead of warm cream, a single restrained gold "signal" accent
      // (a nod to the flag sun, used only for interactive state), and a
      // 7-hue status scale with real hue separation for the map legend.
      colors: {
        paper: '#F1F3EF',
        ink: {
          DEFAULT: '#101A2E',
          soft: '#3D4A63',
          faint: '#8891A3',
        },
        signal: {
          DEFAULT: '#C9971F',
          soft: '#F4E9CE',
        },
        rule: '#D8DCD4',
        status: {
          planning: '#78829A',
          procurement: '#8B5CF6',
          ongoing: '#1D8A5E',
          paused: '#D9A441',
          delayed: '#E0632B',
          completed: '#2153C7',
          cancelled: '#C23B3B',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
