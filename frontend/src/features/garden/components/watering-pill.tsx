import { SymbolView } from 'expo-symbols';
import { Text, View } from 'react-native';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { wateringStatus, type WateringTone } from '../watering';

// The pill's colour says how urgent watering is. Tints are the tone colour at low
// opacity, so no new palette colours. `icon` is a theme key because tintColor takes
// a colour, not a class.
const toneStyles: Record<WateringTone, { pill: string; text: string; icon: ThemeColor }> = {
  none: { pill: 'bg-border/40', text: 'text-text-secondary', icon: 'textSecondary' },
  normal: { pill: 'bg-water/15', text: 'text-water', icon: 'water' },
  soon: { pill: 'bg-accent/15', text: 'text-accent', icon: 'accent' },
  overdue: { pill: 'bg-error/15', text: 'text-error', icon: 'error' },
};

interface WateringPillProps {
  plant: Parameters<typeof wateringStatus>[0];
  now: Date;
}

/** When the plant needs water next ("In 5 days", "Today", "Overdue"), coloured by urgency. */
export function WateringPill({ plant, now }: WateringPillProps) {
  const theme = useTheme();
  const status = wateringStatus(plant, now);
  const tone = toneStyles[status.tone];

  return (
    <View className={`flex-row items-center gap-1 self-start rounded-full px-2.5 py-1 ${tone.pill}`}>
      <SymbolView
        name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
        tintColor={theme[tone.icon]}
        size={12}
      />
      <Text className={`type-body-medium ${tone.text}`}>{status.label}</Text>
    </View>
  );
}
