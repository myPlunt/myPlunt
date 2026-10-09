import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface AppHeaderProps {
  /** Makes the logo + name a button (e.g. back to the feed). */
  onBrandPress?: () => void;
  right?: ReactNode;
}

// Our own header instead of the native stack header, so both platforms get the
// same look (the iOS native back button renders as Liquid Glass).
export function AppHeader({ onBrandPress, right }: AppHeaderProps) {
  const brand = (
    <View className="flex-row items-center gap-2">
      <Image className="h-8 w-7" source={require('@/assets/images/Logo.png')} contentFit="contain" />
      <Text className="type-h5 text-primary" style={styles.wordmark}>
        myPlunt
      </Text>
    </View>
  );

  return (
    <View className="w-full max-w-content flex-row items-center justify-between self-center px-6 py-2">
      {onBrandPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to feed"
          onPress={onBrandPress}
          className="active:opacity-70">
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
  // Lateef has very tall ascent/descent metrics (room for Arabic marks). Any
  // lineHeight shorter than the font's natural height (26px * 2961/2048 ≈ 38)
  // gets clipped from the bottom on iOS, which shifts the glyphs up. Using the
  // natural height keeps the capitals centred in the box, and dropping Android's
  // extra font padding does the same there. This is a style, not classes: a
  // leading-* class loses to type-h5's own line height (plugin utilities come
  // later in the CSS), and the two Android props have no Tailwind class.
  wordmark: {
    lineHeight: 38,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
