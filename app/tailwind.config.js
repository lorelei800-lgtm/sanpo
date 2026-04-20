/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FDFBF7',
        terracotta: '#C4612F',
        dusty: '#6B8E9E',
        ink: '#2B2623',
      },
      fontFamily: {
        serif: ['"Playfair Display"', '"Noto Serif JP"', 'Georgia', 'serif'],
        jp: ['"Noto Serif JP"', '"Playfair Display"', 'serif'],
      },
    },
  },
  plugins: [],
}
