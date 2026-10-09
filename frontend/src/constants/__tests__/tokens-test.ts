import { Fonts, Typography } from '../tokens';

const headlineFonts: string[] = Object.values(Fonts.headline);
const bodyFonts: string[] = Object.values(Fonts.body);

describe('Typography', () => {
  const tokens = Object.entries(Typography);
  const headlines = tokens.filter(([name]) => /^h\d$/.test(name));
  const others = tokens.filter(([name]) => !/^h\d$/.test(name));

  it.each(headlines)('sets headline %s in Lateef', (_name, token) => {
    expect(headlineFonts).toContain(token.fontFamily);
  });

  it.each(others)('sets %s in DM Sans', (_name, token) => {
    expect(bodyFonts).toContain(token.fontFamily);
  });
});
