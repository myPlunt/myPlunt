import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StagingPill } from '@/components/ui/staging-pill';
import { Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { offlineMessages, useNetworkStore, type OfflineReason } from '@/stores/network-store';

import { offlineIcons } from './offline-notice';

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

const explanations: Record<OfflineReason, string> = {
  internet: "Your phone isn't connected to the internet. Your garden and plants still work, and waterings sync once you're back online.",
  server: "The myPlunt server isn't answering right now. Your garden and plants still work, and waterings sync once it's back.",
};

function OfflineButton() {
  const theme = useTheme();
  const { offlineReason } = useNetworkStore();
  const [isExplaining, setIsExplaining] = useState(false);

  useEffect(() => {
    if (!isExplaining) return;
    const timer = setTimeout(() => setIsExplaining(false), EXPLANATION_MS);
    return () => clearTimeout(timer);
  }, [isExplaining]);

  if (!offlineReason) return null;

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={offlineMessages[offlineReason]}
        accessibilityHint="Says what still works"
        accessibilityState={{ expanded: isExplaining }}
        onPress={() => setIsExplaining((open) => !open)}
        className="h-8 w-8 items-center justify-center rounded-full border border-input-border bg-background-element active:opacity-70">
        <SymbolView name={offlineIcons[offlineReason]} tintColor={theme.accent} size={16} />
      </Pressable>
      {isExplaining && (
        <View
          pointerEvents="none"
          className="absolute left-6 top-11 w-60 gap-1 rounded-xl border border-primary/40 bg-info px-3 py-2"
          style={Shadow.card}>
          <Text className="type-label text-action-primary">{offlineMessages[offlineReason]}</Text>
          <Text className="type-caption text-action-primary">{explanations[offlineReason]}</Text>
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
