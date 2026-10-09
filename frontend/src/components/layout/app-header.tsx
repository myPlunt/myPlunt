import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface AppHeaderProps {
  /** Makes the logo + name a button (e.g. back to the feed). */
  onBrandPress?: () => void;
  right?: ReactNode;
}

// Our own header instead of the native stack header, so both platforms get the
// same look (the iOS native back button renders as Liquid Glass).
export function AppHeader({ onBrandPress, right }: AppHeaderProps) {
  const theme = useTheme();

  const brand = (
    <View style={styles.brand}>
      <Image style={styles.logo} source={require('@/assets/images/Logo.png')} contentFit="contain" />
      <ThemedText style={[Typography.h5, styles.wordmark, { color: theme.primary }]}>myPlunt</ThemedText>
    </View>
  );

  return (
    <View style={styles.header}>
      {onBrandPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to feed"
          onPress={onBrandPress}
          style={({ pressed }) => pressed && styles.pressed}>
          {brand}
        </Pressable>
      ) : (
        brand
      )}
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 28,
    height: 32,
  },
  // Lateef has very tall ascent/descent metrics (room for Arabic marks). Any
  // lineHeight shorter than the font's natural height (26px * 2961/2048 ≈ 38)
  // gets clipped from the bottom on iOS, which shifts the glyphs up. Using the
  // natural height keeps the capitals centred in the box, and dropping Android's
  // extra font padding does the same there.
  wordmark: {
    lineHeight: 38,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
