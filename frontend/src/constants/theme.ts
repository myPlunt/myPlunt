import '@/global.css';

import { Platform } from 'react-native';

// Brand palette
export const brand = {
  hunterGreen900: '#263521',
  hunterGreen700: '#304329',
  hunterGreen500: '#3B5232',
  hunterGreen300: '#93A08E',
  hunterGreen100: '#E2E5E0',
  fern900: '#354A2E',
  fern700: '#435D39',
  fern500: '#527246',
  fern300: '#A0B199',
  fern100: '#E5EAE3',
  oliveWood900: '#5C4A34',
  oliveWood700: '#745D42',
  oliveWood500: '#8D7250',
  oliveWood300: '#C0B19F',
  oliveWood100: '#EEEAE5',
  sandDune: '#E7DCC5',
  softLinen: '#EAE4D7',
  grey900: '#1F2420',
  grey700: '#4A504B',
  grey500: '#7B807C',
  grey300: '#BFC3BF',
  grey100: '#F2F2EF',
  white: '#FFFFFF',
  // Not in brand palette, but fits
  error500: '#B3402F',
} as const;

const lightTheme = {
  text: brand.grey900,
  background: brand.sandDune,
  backgroundElement: brand.softLinen,
  backgroundSelected: brand.fern100,
  textSecondary: brand.grey700,
  // "primary" (Fern) is used for links/wordmark already on screen — kept as-is.
  // actionPrimary (Hunter Green) is the design study's actual documented
  // primary color, reserved for the main action button specifically.
  primary: brand.fern500,
  actionPrimary: brand.hunterGreen500,
  accent: brand.oliveWood700,
  accentMuted: brand.oliveWood900,
  border: brand.grey300,
  error: brand.error500,
} as const;

export const Colors = {
  light: lightTheme,
  dark: lightTheme,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  headline: {
    semiBold: 'Lateef_600SemiBold',
    medium: 'Lateef_500Medium',
  },
  body: {
    semiBold: 'DMSans_600SemiBold',
    medium: 'DMSans_500Medium',
    regular: 'DMSans_400Regular',
  },
  // Not part of the brand type scale — used only for dev-tool hint text
  mono: Platform.select({ ios: 'ui-monospace', android: 'monospace', web: 'var(--font-mono)' }) ?? 'monospace',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Typography = {
  h1: { fontFamily: Fonts.headline.semiBold, fontSize: 56, lineHeight: 64 },
  h2: { fontFamily: Fonts.headline.semiBold, fontSize: 48, lineHeight: 56 },
  h3: { fontFamily: Fonts.headline.semiBold, fontSize: 40, lineHeight: 48 },
  h4: { fontFamily: Fonts.headline.medium, fontSize: 32, lineHeight: 40 },
  h5: { fontFamily: Fonts.headline.medium, fontSize: 26, lineHeight: 32 },
  subtitleLarge: { fontFamily: Fonts.body.semiBold, fontSize: 18, lineHeight: 26 },
  subtitleSmall: { fontFamily: Fonts.body.medium, fontSize: 16, lineHeight: 24 },
  bodyLarge: { fontFamily: Fonts.body.regular, fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontFamily: Fonts.body.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: Fonts.body.regular, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: Fonts.body.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.48 },
  buttonMedium: { fontFamily: Fonts.body.semiBold, fontSize: 14, lineHeight: 18, letterSpacing: 0.14 },
  buttonLarge: { fontFamily: Fonts.body.semiBold, fontSize: 16, lineHeight: 20, letterSpacing: 0.16 },
} as const;

// From the design study's "Shadow/Level 2" effect (two drop shadows layered;
// RN only supports one per View, so this uses the subtler of the two layers —
// the stronger one read as too heavy/distracting on screen.
export const Shadow = {
  level2: {
    shadowColor: brand.grey900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
} as const;

export const MaxContentWidth = 800;
