import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useNetworkStore } from '@/stores/network-store';

// Clears the tab bar and its raised Add button, so the chip never covers a tab.
const ABOVE_TAB_BAR = 100;

export function OfflineNotice() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isOffline, notice } = useNetworkStore();

  // The chip can't be focused, so screen readers are told directly.
  useEffect(() => {
    if (notice) AccessibilityInfo.announceForAccessibility(notice);
  }, [notice]);

  return (
    <View pointerEvents="none" className="absolute inset-x-0 items-center" style={{ bottom: insets.bottom + ABOVE_TAB_BAR }}>
      {notice && (
        // Keyed by its text, so a new message comes in as a new chip.
        <Animated.View
          key={notice}
          entering={FadeInUp.duration(200)}
          exiting={FadeOutDown.duration(200)}
          className="flex-row items-center gap-2 rounded-full border border-primary/40 bg-info px-4 py-2.5"
          style={Shadow.card}>
          <SymbolView
            name={
              isOffline
                ? { ios: 'wifi.slash', android: 'wifi_off', web: 'wifi_off' }
                : { ios: 'checkmark', android: 'check', web: 'check' }
            }
            tintColor={theme.actionPrimary}
            size={16}
          />
          <Text className="type-body-medium text-action-primary">{notice}</Text>
        </Animated.View>
      )}
    </View>
  );
}
