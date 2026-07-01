/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#090d16',
        darkCard: '#131926',
        darkBorder: '#1f293d',
        lightBg: '#f8fafc',
        lightCard: '#ffffff',
        lightBorder: '#e2e8f0',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
