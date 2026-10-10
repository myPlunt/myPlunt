import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

interface AppHeaderProps {
  /** Makes the logo a back button. Off on the tabs, which have nothing to go back to. */
  showBack?: boolean;
  right?: ReactNode;
}

// Our own header instead of the native stack header, so both platforms get the
// same look (the iOS native back button renders as Liquid Glass). No page name:
// the tab bar and each page's own content already say where you are.
export function AppHeader({ showBack, right }: AppHeaderProps) {
  return (
    <View className="w-full max-w-content flex-row items-center justify-between self-center px-6 py-2">
      {showBack ? <LogoBackButton /> : <Logo />}
      {right}
    </View>
  );
}

/** The logo as a back button, for screens that lay out their own top row. */
export function LogoBackButton() {
  const router = useRouter();

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
    <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={goBack} className="active:opacity-70">
      <Logo />
    </Pressable>
  );
}

function Logo() {
  return <Image className="h-10 w-9" source={require('@/assets/images/Logo.png')} contentFit="contain" />;
}
