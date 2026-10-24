/**
 * Centralized Design Tokens for REint Energy | Forecasting IQ
 * 
 * Aesthetic: PREMIUM DARK ENERGY TRADING / FINANCIAL TERMINAL
 * Visual Foundation:
 * - BACKGROUND: #0B0D0D
 * - SIDEBAR: #080A0A
 * - CARD: #111514
 * - ELEVATED CARD: #151A18
 * - BORDER: #252C29
 * - PRIMARY TEXT: #F1F4F1
 * - SECONDARY TEXT: #8B9691
 * - MUTED TEXT: #5F6A65
 * 
 * Data Identity:
 * - ACTUAL WIND (Emerald): #35B89A
 * - DAY-AHEAD FORECAST (Terracotta): #E58A5C
 * - UNCERTAINTY (Ochre): #D7B35A
 * - ERROR (Soft Red): #E0645A
 */

export const COLOR_TOKENS = {
  canvas: {
    bg: '#0B0D0D',
    sidebar: '#080A0A',
    card: '#111514',
    cardElevated: '#151A18',
    border: '#252C29',
    borderLight: '#1C2220',
    divider: '#252C29',
  },

  text: {
    primary: '#F1F4F1',
    secondary: '#8B9691',
    muted: '#5F6A65',
    faint: '#3D4441',
  },

  data: {
    actual: '#35B89A',
    actualArea: 'rgba(53, 184, 154, 0.12)',
    actualAreaSubtle: 'rgba(53, 184, 154, 0.04)',

    forecast: '#E58A5C',
    forecastArea: 'rgba(229, 138, 92, 0.08)',
    forecastSubtle: 'rgba(229, 138, 92, 0.16)',

    uncertainty: '#D7B35A',
    uncertaintyBand: 'rgba(215, 179, 90, 0.10)',
    uncertaintyBorder: 'rgba(215, 179, 90, 0.35)',

    error: '#E0645A',
    errorBg: 'rgba(224, 100, 90, 0.12)',
    errorBorder: 'rgba(224, 100, 90, 0.35)',
  },
} as const;

export type ColorTokens = typeof COLOR_TOKENS;
