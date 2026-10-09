import { Text, type TextProps } from 'react-native';

import { ThemeColor, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  themeColor?: ThemeColor;
};

// Defaults to body text in the theme's text colour; pass a Typography token in
// `style` and a semantic key in `themeColor` to change either.
export function ThemedText({ style, themeColor = 'text', ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[Typography.bodyLarge, { color: theme[themeColor] }, style]} {...rest} />;
}
