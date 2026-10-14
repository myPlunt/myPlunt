import { SymbolView } from 'expo-symbols';
import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/**
 * The user's watering streak as a small badge for the corner of their avatar: every plant's
 * current streak added up, as on the garden's cards. Round for short numbers; it widens into
 * a pill once the number needs more room.
 */
export function WateringStreakBadge({ streak }: { streak: number }) {
  const theme = useTheme();

  return (
    // The border in the page colour cuts the badge out of the avatar's edge.
    <View
      accessible
      accessibilityLabel={`Watering streak: ${streak}`}
      className="h-9 min-w-9 flex-row items-center justify-center gap-0.5 rounded-full border-2 border-background bg-water px-2">
      {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
      <SymbolView
        name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
        tintColor={theme.backgroundElement}
        size={12}
      />
      <Text className="type-button-medium text-background-element">{streak}</Text>
    </View>
  );
}
