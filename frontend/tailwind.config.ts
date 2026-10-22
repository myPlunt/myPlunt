import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

import { Fonts, lightColors, MaxContentWidth, Typography } from './src/constants/tokens';

const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const colors = Object.fromEntries(
  Object.entries(lightColors).map(([key, value]) => [kebab(key), value]),
);

// One class per type-scale token, so text never mixes a size with the wrong font.
const typography = plugin(({ addUtilities }) => {
  addUtilities(
    Object.fromEntries(
      Object.entries(Typography).map(([key, token]) => [
        `.type-${kebab(key)}`,
        {
          fontFamily: token.fontFamily,
          fontSize: `${token.fontSize}px`,
          lineHeight: `${token.lineHeight}px`,
          ...('letterSpacing' in token ? { letterSpacing: `${token.letterSpacing}px` } : {}),
        },
      ]),
    ),
  );
});

export default {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    // Replaces (not extends) the default palette, so only our semantic colours exist.
    colors: {
      transparent: 'transparent',
      ...colors,
    },
    // Each weight is its own family (React Native has no synthetic bold). Prefer the type-* classes.
    fontFamily: {
      headline: [Fonts.headline.semiBold],
      'headline-medium': [Fonts.headline.medium],
      body: [Fonts.body.regular],
      'body-medium': [Fonts.body.medium],
      'body-semibold': [Fonts.body.semiBold],
    },
    extend: {
      maxWidth: {
        content: `${MaxContentWidth}px`,
      },
    },
  },
  plugins: [typography],
} satisfies Config;
