/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: '#EEF2F1',
          surface: '#FFFFFF',
          divider: '#DCE3E0',
          dividerLight: '#E8EDEA',
        },
        ink: {
          primary: '#18201F',
          secondary: '#687370',
          muted: '#8B9692',
          faint: '#B0B9B6',
        },
        terminal: {
          emerald: '#087F6A',      // Actual Wind
          terracotta: '#C96A3D',   // Forecast
          ochre: '#D5A83E',        // Uncertainty
          red: '#C84B4B',          // Forecast Error
          subtleGreen: '#8BAFA7',
        }
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'terminal-sm': '0 1px 3px 0 rgba(24, 32, 31, 0.04), 0 1px 2px -1px rgba(24, 32, 31, 0.04)',
        'terminal-md': '0 4px 16px -2px rgba(24, 32, 31, 0.05), 0 2px 6px -2px rgba(24, 32, 31, 0.03)',
        'terminal-lg': '0 12px 28px -4px rgba(24, 32, 31, 0.06), 0 4px 10px -2px rgba(24, 32, 31, 0.02)',
      },
    },
  },
  plugins: [],
}
