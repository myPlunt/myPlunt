// Design tokens as plain data, with no React Native imports, so that
// tailwind.config.ts (run by Node at build time) and theme.ts (runtime) share
// one source. Change a value here and both the classes and useTheme() follow.

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
  // Not in brand palette: approved for water only (the water line in the garden's
  // plant pots). A muted blue so it sits with the earthy brand colours.
  waterBlue500: '#4E6F9C',
} as const;

// Semantic colour roles. Tailwind exposes each key in kebab-case
// (backgroundElement -> bg-background-element, textSecondary -> text-text-secondary).
export const lightColors = {
  text: brand.grey900,
  background: brand.sandDune,
  backgroundElement: brand.softLinen,
  textSecondary: brand.grey700,
  // "primary" (Fern) is used for links/wordmark already on screen — kept as-is.
  // actionPrimary (Hunter Green) is the design study's actual documented
  // primary color, reserved for the main action button specifically.
  primary: brand.fern500,
  actionPrimary: brand.hunterGreen500,
  accent: brand.oliveWood700,
  accentMuted: brand.oliveWood500,
  border: brand.grey300,
  // Text-field outline and placeholder; the form field used these brand values directly before.
  inputBorder: brand.oliveWood300,
  placeholder: brand.grey500,
  error: brand.error500,
  water: brand.waterBlue500,
  // Bottom tab bar: icon and label of the open tab and of the others.
  tabActive: brand.hunterGreen500,
  tabInactive: brand.fern500,
} as const;

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
} as const;

// Type scale. Tailwind turns each entry into a `type-<kebab-name>` class that sets
// font family, size, line height and letter spacing together (type-h3, type-body-medium...).
// Brand rule: Lateef is the primary typeface and is used only for headlines (h1–h5),
// where it gives a warm, organic character. DM Sans is the secondary typeface for
// everything else (subtitles, body, captions, labels, buttons): clean, geometric and
// readable at small sizes. tokens-test.ts enforces this split.
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

export const MaxContentWidth = 800;
