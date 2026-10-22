import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StagingPill } from '@/components/ui/staging-pill';
import { Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useNetworkStore } from '@/stores/network-store';

interface AppHeaderProps {
  showBack?: boolean;
  right?: ReactNode;
}

// Our own header, not the native one, so iOS doesn't get a Liquid Glass back button.
export function AppHeader({ showBack, right }: AppHeaderProps) {
  return (
    // z-10 lifts the offline explanation over the page below the header.
    <View className="z-10 w-full max-w-content flex-row items-center justify-between self-center px-6 py-2">
      <View className="flex-row items-center gap-2">
        {showBack ? <LogoBackButton /> : <Logo />}
        <StagingPill />
        <OfflineButton />
      </View>
      {right}
    </View>
  );
}

export function LogoBackButton() {
  const router = useRouter();

  function goBack() {
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

const EXPLANATION_MS = 4000;

function OfflineButton() {
  const theme = useTheme();
  const { isOffline } = useNetworkStore();
  const [isExplaining, setIsExplaining] = useState(false);

  useEffect(() => {
    if (!isExplaining) return;
    const timer = setTimeout(() => setIsExplaining(false), EXPLANATION_MS);
    return () => clearTimeout(timer);
  }, [isExplaining]);

  if (!isOffline) return null;

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="You're offline"
        accessibilityHint="Says what still works"
        accessibilityState={{ expanded: isExplaining }}
        onPress={() => setIsExplaining((open) => !open)}
        className="h-8 w-8 items-center justify-center rounded-full border border-input-border bg-background-element active:opacity-70">
        <SymbolView name={{ ios: 'wifi.slash', android: 'wifi_off', web: 'wifi_off' }} tintColor={theme.accent} size={16} />
      </Pressable>
      {isExplaining && (
        <View
          pointerEvents="none"
          className="absolute left-6 top-11 w-60 rounded-xl border border-primary/40 bg-info px-3 py-2"
          style={Shadow.card}>
          <Text className="type-caption text-action-primary">You&apos;re offline. Your garden and plants still work.</Text>
        </View>
      )}
    </View>
  );
}

function Logo() {
  const { isOffline } = useNetworkStore();
  return (
    <View style={isOffline && styles.offlineLogo}>
      <Image className="h-10 w-9" source={require('@/assets/images/Logo.png')} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  // A style, not classes: NativeWind doesn't turn a grayscale class into React Native's filter.
  offlineLogo: { filter: [{ grayscale: 1 }], opacity: 0.55 },
});
