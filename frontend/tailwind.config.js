/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0B0D0D',
          sidebar: '#080A0A',
          card: '#111514',
          cardElevated: '#151A18',
          border: '#252C29',
          borderSubtle: '#1C2220',
        },
        ink: {
          primary: '#F1F4F1',
          secondary: '#8B9691',
          muted: '#5F6A65',
          faint: '#3D4441',
        },
        energy: {
          actual: '#35B89A',      // Emerald Actual
          forecast: '#E58A5C',    // Terracotta Forecast
          uncertainty: '#D7B35A', // Ochre Uncertainty
          error: '#E0645A',       // Soft Red Error
        }
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'card': '16px',
        'card-sm': '12px',
      },
      boxShadow: {
        'terminal-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.35)',
        'terminal-card': '0 4px 18px 0 rgba(0, 0, 0, 0.40)',
      },
    },
  },
  plugins: [],
}
