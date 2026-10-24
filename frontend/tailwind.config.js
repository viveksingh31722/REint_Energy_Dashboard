/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B132B',
          800: '#1C2541',
          700: '#1E293B',
          600: '#334155',
        },
        wind: {
          teal: '#06B6D4',
          darkTeal: '#0E7490',
          violet: '#8B5CF6',
          darkViolet: '#6D28D9',
          amber: '#F59E0B',
          rose: '#F43F5E',
          emerald: '#10B981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
