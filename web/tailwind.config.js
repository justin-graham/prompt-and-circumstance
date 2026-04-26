/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF8F3',
        ink: '#1A1A1A',
        muted: '#6B6257',
        rule: '#DDD6CA',
        accent: '#0F6B65',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
