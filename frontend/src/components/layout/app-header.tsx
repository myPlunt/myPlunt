import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface AppHeaderProps {
  /** The page name, shown centred. */
  title: string;
  /** Makes the logo a back button. Off on the feed, which is the first screen. */
  showBack?: boolean;
  right?: ReactNode;
}

// Our own header instead of the native stack header, so both platforms get the
// same look (the iOS native back button renders as Liquid Glass).
export function AppHeader({ title, showBack, right }: AppHeaderProps) {
  const router = useRouter();
  const logo = <Image className="h-10 w-9" source={require('@/assets/images/Logo.png')} contentFit="contain" />;

  function goBack() {
    // Nothing to go back to when the app was opened straight onto this screen
    // (e.g. a deep link), so fall back to the feed.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  return (
    <View className="w-full max-w-content flex-row items-center justify-between self-center px-6 py-2">
      {/* Centred over the whole bar rather than between the side items, so it stays
          in the middle whatever width the logo and right-hand button have. */}
      <View pointerEvents="none" className="absolute inset-x-0 items-center">
        <Text accessibilityRole="header" className="type-h5 text-action-primary" style={styles.title}>
          {title}
        </Text>
      </View>

      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={goBack}
          className="active:opacity-70">
          {logo}
        </Pressable>
      ) : (
        logo
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
  title: {
    lineHeight: 38,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
