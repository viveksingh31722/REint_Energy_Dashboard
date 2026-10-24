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
          bg: '#F4F6F8',
          secondary: '#EEF1F4',
          solid: '#FFFFFF',
          border: '#E4E8EC',
          borderLight: '#EDF0F3',
          divider: '#E4E8EC',
        },
        ink: {
          primary: '#17202A',
          secondary: '#66717C',
          muted: '#8D98A3',
          subtle: '#B2BAC2',
        },
        energy: {
          actual: '#168F79',        // Muted emerald / teal
          actualLight: '#23A890',
          forecast: '#E27D4F',      // Soft coral / orange
          forecastLight: '#EE946C',
          uncertainty: '#E6B84F',   // Warm muted yellow
          error: '#D95C55',         // Soft red-orange
          positive: '#3D9B76',      // Positive / good
          neutral: '#66717C',       // Neutral
        }
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glass-sm': '0 4px 16px 0 rgba(23, 32, 42, 0.04)',
        'glass-md': '0 8px 32px 0 rgba(23, 32, 42, 0.06)',
        'glass-lg': '0 16px 40px 0 rgba(23, 32, 42, 0.09)',
        'glass-float': '0 20px 48px -8px rgba(23, 32, 42, 0.12)',
      },
      backdropBlur: {
        xs: '4px',
        glass: '20px',
        heavy: '28px',
      }
    },
  },
  plugins: [],
}
