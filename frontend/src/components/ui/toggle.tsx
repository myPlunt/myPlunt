import { useEffect, useState } from 'react';
import { Animated, Pressable } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

// Our own toggle: the native Switch looks different on each platform (Liquid Glass on iOS).
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const theme = useTheme();
  const [progress] = useState(() => new Animated.Value(checked ? 1 : 0));

  useEffect(() => {
    // Colours can't run on the native driver, and one value drives both colour and position.
    Animated.timing(progress, { toValue: checked ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [checked, progress]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      hitSlop={8}
      className="active:opacity-70">
      <Animated.View
        className="h-6 w-10 justify-center rounded-full border-[1.5px] px-1"
        style={{
          backgroundColor: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [theme.background, theme.toggleOnTrack],
          }),
          borderColor: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [theme.inputBorder, theme.actionPrimary],
          }),
        }}>
        <Animated.View
          className="h-4 w-4 rounded-full"
          style={{
            backgroundColor: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [theme.inputBorder, theme.actionPrimary],
            }),
            // Track 40 - 3 border - 8 padding - 16 knob = 13px of travel, 4px clear of each end.
            transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 13] }) }],
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
