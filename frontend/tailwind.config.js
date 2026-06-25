/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Premium Dark/Vibrant Palette
        brand: {
          50: '#f5f7fa',
          100: '#eaeef4',
          200: '#d0daf2',
          500: '#6366f1', // Vibrant Indigo
          600: '#4f46e5',
          700: '#3730a3',
          900: '#1e1b4b',
        },
        safety: {
          low: '#10b981',       // Emerald Green
          medium: '#f59e0b',    // Amber Yellow
          high: '#f97316',      // Orange
          critical: '#ef4444',  // Red
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
