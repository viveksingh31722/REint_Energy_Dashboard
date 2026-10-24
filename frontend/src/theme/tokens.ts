/**
 * Centralized Design Tokens for REint Energy | Forecasting IQ
 * 
 * Aesthetic: PREMIUM LIGHT GLASSMORPHIC
 * Palette:
 * - Canvas Background: #F4F6F8
 * - Secondary Background: #EEF1F4
 * - Glass Surfaces: rgba(255, 255, 255, 0.65) + blur(20px)
 * - Elevated Glass: rgba(255, 255, 255, 0.82)
 * - Solid Data Surfaces: #FFFFFF
 * - Translucent Borders: rgba(255, 255, 255, 0.75) / #E4E8EC
 * - Typography: Primary #17202A, Secondary #66717C, Muted #8D98A3
 * 
 * Domain Data:
 * - Actual Wind: #168F79 (Muted emerald / teal)
 * - Day-Ahead Forecast: #E27D4F (Soft coral / orange)
 * - Uncertainty: #E6B84F (Warm muted yellow / gold)
 * - Forecast Error: #D95C55 (Soft red-orange)
 * - Positive / Good: #3D9B76
 * - Neutral: #66717C
 */

export const COLOR_TOKENS = {
  canvas: {
    bg: '#F4F6F8',
    bgSecondary: '#EEF1F4',
    solidSurface: '#FFFFFF',
    borderSubtle: '#E4E8EC',
    borderLight: '#EDF0F3',
    divider: '#E4E8EC',
  },

  glass: {
    surface: 'rgba(255, 255, 255, 0.65)',
    surfaceElevated: 'rgba(255, 255, 255, 0.82)',
    surfaceHover: 'rgba(255, 255, 255, 0.92)',
    surfaceActive: 'rgba(255, 255, 255, 0.98)',
    border: 'rgba(255, 255, 255, 0.75)',
    borderHover: 'rgba(255, 255, 255, 0.95)',
    shadow: '0 8px 32px 0 rgba(23, 32, 42, 0.06)',
    shadowElevated: '0 16px 40px 0 rgba(23, 32, 42, 0.09)',
    shadowFloating: '0 20px 48px -8px rgba(23, 32, 42, 0.12)',
  },

  text: {
    primary: '#17202A',
    secondary: '#66717C',
    muted: '#8D98A3',
    subtle: '#B2BAC2',
    white: '#FFFFFF',
  },

  data: {
    // ACTUAL: Muted Emerald / Teal
    actual: '#168F79',
    actualLight: '#23A890',
    actualArea: 'rgba(22, 143, 121, 0.08)',
    actualAreaHover: 'rgba(22, 143, 121, 0.14)',
    actualGlow: 'rgba(22, 143, 121, 0.35)',

    // FORECAST: Soft Coral / Orange
    forecast: '#E27D4F',
    forecastLight: '#EE946C',
    forecastArea: 'rgba(226, 125, 79, 0.06)',
    forecastGlow: 'rgba(226, 125, 79, 0.35)',

    // UNCERTAINTY: Warm Muted Yellow
    uncertainty: '#E6B84F',
    uncertaintyBand: 'rgba(230, 184, 79, 0.14)',
    uncertaintyBorder: 'rgba(230, 184, 79, 0.45)',

    // ERROR: Soft Red-Orange
    error: '#D95C55',
    errorLight: '#E5736D',
    errorBg: 'rgba(217, 92, 85, 0.08)',
    errorBorder: 'rgba(217, 92, 85, 0.25)',

    // POSITIVE / GOOD
    positive: '#3D9B76',
    positiveBg: 'rgba(61, 155, 118, 0.08)',

    // NEUTRAL
    neutral: '#66717C',
    neutralBg: 'rgba(102, 113, 124, 0.08)',
  },
} as const;

export type ColorTokens = typeof COLOR_TOKENS;
