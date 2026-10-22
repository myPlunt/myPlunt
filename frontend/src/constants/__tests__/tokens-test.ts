import { Fonts, Typography } from '../tokens';

const headlineFonts: string[] = Object.values(Fonts.headline);
const bodyFonts: string[] = Object.values(Fonts.body);

describe('Typography', () => {
  const tokens = Object.entries(Typography);
  const headlines = tokens.filter(([name]) => /^h\d$/.test(name));
  const others = tokens.filter(([name]) => !/^h\d$/.test(name));

  it('sets every headline in Lateef', () => {
    for (const [, token] of headlines) expect(headlineFonts).toContain(token.fontFamily);
  });

  it('sets every other token in DM Sans', () => {
    for (const [, token] of others) expect(bodyFonts).toContain(token.fontFamily);
  });
});
