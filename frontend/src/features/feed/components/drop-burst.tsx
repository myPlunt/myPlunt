import { SymbolView } from 'expo-symbols';
import { View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '@/hooks/use-theme';

// Pops in a little past full size, settles, holds, then fades out growing slightly.
const BURST = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.3 }] },
  20: { opacity: 1, transform: [{ scale: 1.15 }] },
  35: { opacity: 1, transform: [{ scale: 1 }] },
  75: { opacity: 1, transform: [{ scale: 1 }] },
  100: { opacity: 0, transform: [{ scale: 1.1 }] },
}).duration(900);

/**
 * A big drop of water over a post's photo when the user double-taps it to water it. Mount it with a
 * new key per double-tap; onDone unmounts it, since a layout animation ends back at full opacity.
 */
export function DropBurst({ onDone }: { onDone: () => void }) {
  const theme = useTheme();

  return (
    <View className="pointer-events-none absolute inset-0 items-center justify-center">
      <Animated.View
        entering={BURST.withCallback((finished) => {
          'worklet';
          if (finished) {
            scheduleOnRN(onDone);
          }
        })}>
        {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
        <SymbolView
          name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
          tintColor={theme.water}
          size={96}
        />
      </Animated.View>
    </View>
  );
}
