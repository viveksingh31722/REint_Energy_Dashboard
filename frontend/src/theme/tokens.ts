/**
 * Centralized Design Tokens for REint Energy | Forecasting IQ
 * 
 * Aesthetic: PREMIUM ENERGY INTELLIGENCE TERMINAL
 * Visual Foundation:
 * - Canvas Background: #EEF2F1 (Warm off-white / sage-tinted neutral)
 * - Primary Surface: #FFFFFF
 * - Glass Surface: rgba(255, 255, 255, 0.72)
 * - Strong Glass: rgba(255, 255, 255, 0.88)
 * - Divider: #DCE3E0
 * - Typography: Primary #18201F, Secondary #687370, Muted #8B9692
 * 
 * Data Identity:
 * - ACTUAL WIND (Emerald): #087F6A
 * - DAY-AHEAD FORECAST (Terracotta): #C96A3D
 * - UNCERTAINTY (Ochre): #D5A83E
 * - ERROR (Soft Red): #C84B4B
 * - SUBTLE GREEN: #8BAFA7
 */

export const COLOR_TOKENS = {
  canvas: {
    bg: '#EEF2F1',
    surface: '#FFFFFF',
    glass: 'rgba(255, 255, 255, 0.72)',
    glassStrong: 'rgba(255, 255, 255, 0.88)',
    divider: '#DCE3E0',
    dividerLight: '#E8EDEA',
    border: '#DCE3E0',
  },

  text: {
    primary: '#18201F',
    secondary: '#687370',
    muted: '#8B9692',
    faint: '#B0B9B6',
    white: '#FFFFFF',
  },

  data: {
    // ACTUAL: Deep Emerald
    actual: '#087F6A',
    actualArea: 'rgba(8, 127, 106, 0.08)',
    actualAreaHover: 'rgba(8, 127, 106, 0.14)',
    actualSubtle: '#8BAFA7',

    // FORECAST: Terracotta
    forecast: '#C96A3D',
    forecastArea: 'rgba(201, 106, 61, 0.05)',
    forecastSubtle: 'rgba(201, 106, 61, 0.12)',

    // UNCERTAINTY: Ochre
    uncertainty: '#D5A83E',
    uncertaintyBand: 'rgba(213, 168, 62, 0.10)',
    uncertaintyBorder: 'rgba(213, 168, 62, 0.35)',

    // ERROR: Soft Red
    error: '#C84B4B',
    errorBg: 'rgba(200, 75, 75, 0.08)',
    errorBorder: 'rgba(200, 75, 75, 0.25)',

    // NEUTRAL / MUTED DATA
    neutral: '#687370',
  },
} as const;

export type ColorTokens = typeof COLOR_TOKENS;
