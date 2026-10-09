import { lightColors } from './tokens';

export { brand, Fonts, MaxContentWidth, Typography } from './tokens';

// Styling is done with NativeWind classes (see tailwind.config.ts). These runtime
// values are for the few props that can't take a class: tintColor, color on
// ActivityIndicator, placeholderTextColor, navigation options.
export const Colors = {
  light: lightColors,
  dark: lightColors,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// From the design study's "Shadow/Level 2" effect (two drop shadows layered;
// RN only supports one per View, so this uses the subtler of the two layers —
// the stronger one read as too heavy/distracting on screen.
// Kept as a style object because it must set both iOS shadow* and Android
// elevation; pass it through `style` next to className.
export const Shadow = {
  level2: {
    shadowColor: '#1F2E1B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  // For cards (e.g. the forms on Edit profile and Settings): softer and wider than
  // level2 so a large surface lifts off the background without a hard edge.
  card: {
    shadowColor: '#1F2E1B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;
