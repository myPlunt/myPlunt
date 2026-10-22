import { SymbolView } from 'expo-symbols';
import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function WateringStreakBadge({ streak }: { streak: number }) {
  const theme = useTheme();

  return (
    // The border in the page colour cuts the badge out of the avatar's edge.
    <View
      accessible
      accessibilityLabel={`Watering streak: ${streak}`}
      className="h-9 min-w-9 flex-row items-center justify-center gap-0.5 rounded-full border-2 border-background bg-water px-2">
      <SymbolView
        name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
        tintColor={theme.backgroundElement}
        size={12}
      />
      <Text className="type-button-medium text-background-element">{streak}</Text>
    </View>
  );
}
