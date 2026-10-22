import { SymbolView } from 'expo-symbols';
import { View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '@/hooks/use-theme';

const BURST = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.3 }] },
  20: { opacity: 1, transform: [{ scale: 1.15 }] },
  35: { opacity: 1, transform: [{ scale: 1 }] },
  75: { opacity: 1, transform: [{ scale: 1 }] },
  100: { opacity: 0, transform: [{ scale: 1.1 }] },
}).duration(900);

/** Mount with a new key per double-tap; onDone must unmount it, as the animation ends at full opacity. */
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
        <SymbolView
          name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
          tintColor={theme.water}
          size={96}
        />
      </Animated.View>
    </View>
  );
}
