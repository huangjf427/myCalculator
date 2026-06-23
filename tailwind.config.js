/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wealth: {
          dark: '#1a3a3a',
          gold: '#c9a96e',
          'gold-light': '#d4b87a',
          'gold-dark': '#b8955a',
          cream: '#f5f0eb',
          'cream-dark': '#ebe3d9',
          text: '#2d2d2d',
          'text-light': '#6b6b6b',
          card: '#ffffff',
          border: '#e5ddd3',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Noto Sans SC"', '"Source Han Sans SC"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
