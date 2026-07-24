/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // The "professional government dashboard" palette gets defined here
      // when we build the design system — kept empty until then so we're
      // not guessing at colors before we design the UI.
    },
  },
  darkMode: 'class',
  plugins: [],
};
