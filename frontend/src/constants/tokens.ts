// Plain data with no React Native imports, so tailwind.config.ts (Node, at build time) can share it.

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
  error500: '#B3402F',
  // Not in the brand palette: approved for water only.
  waterBlue500: '#4E6F9C',
  // Not in the brand palette: approved for the watering pill's urgency steps only.
  mustard500: '#D4A017',
  orange500: '#E07B24',
  // Not in the brand palette: approved for the feed's sticky notes only (muted Post-it "Jaipur").
  noteGreen: '#C9DCAB',
  noteYellow: '#EEDC9E',
  noteOrange: '#EBC59C',
  notePink: '#E4B7C3',
  noteTeal: '#ADD5CD',
} as const;

// Tailwind exposes each key in kebab-case: backgroundElement -> bg-background-element.
export const lightColors = {
  text: brand.grey900,
  background: brand.sandDune,
  backgroundElement: brand.softLinen,
  textSecondary: brand.grey700,
  // Despite the name, primary (Fern) is for links; actionPrimary (Hunter Green) is the main button's.
  primary: brand.fern500,
  actionPrimary: brand.hunterGreen500,
  accent: brand.oliveWood700,
  accentMuted: brand.oliveWood500,
  border: brand.grey300,
  inputBorder: brand.oliveWood300,
  placeholder: brand.grey500,
  error: brand.error500,
  water: brand.waterBlue500,
  snow: brand.white,
  wateringSoon: brand.mustard500,
  wateringTomorrow: brand.orange500,
  tabActive: brand.hunterGreen500,
  tabInactive: brand.fern500,
  noteGreen: brand.noteGreen,
  noteYellow: brand.noteYellow,
  noteOrange: brand.noteOrange,
  notePink: brand.notePink,
  noteTeal: brand.noteTeal,
  toggleOnTrack: brand.fern300,
  info: brand.fern100,
  staging: brand.mustard500,
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

// Each entry becomes a type-<kebab-name> class. Brand rule: Lateef only for headlines (h1–h5), DM Sans
// for everything else; tokens-test.ts checks it.
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
