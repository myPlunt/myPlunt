import { lightColors, Typography } from './tokens';

export { brand, Fonts, MaxContentWidth, Typography } from './tokens';

// For the few props that can't take a NativeWind class: tintColor, placeholderTextColor,
// ActivityIndicator's color and navigation options.
export const Colors = {
  light: lightColors,
  dark: lightColors,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Style objects, not classes: they must set both iOS shadow* and Android elevation. RN draws one
// shadow per View, so level2 uses the subtler of the design's two layers.
export const Shadow = {
  level2: {
    shadowColor: '#1F2E1B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: '#1F2E1B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

/**
 * No lineHeight: with one, iOS draws single-line input text at the bottom of the box. Android needs
 * its vertical padding removed and explicit centring to do the same.
 */
export const singleLineInputText = {
  fontFamily: Typography.bodyLarge.fontFamily,
  fontSize: Typography.bodyLarge.fontSize,
  paddingVertical: 0,
  textAlignVertical: 'center',
} as const;
