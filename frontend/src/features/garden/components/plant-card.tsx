import { SymbolView } from 'expo-symbols';
import { Text, View } from 'react-native';

import { Shadow, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GardenPlant } from '@/lib/garden/types';

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

interface PlantCardProps {
  plant: GardenPlant;
  now: Date;
}

export function PlantCard({ plant, now }: PlantCardProps) {
  const theme = useTheme();
  const status = wateringStatus(plant, now);
  const tone = toneStyles[status.tone];

  return (
    // Shadow goes through style so it sets both iOS shadow* and Android elevation.
    <View className="w-[168px] rounded-3xl bg-background-element p-2" style={Shadow.card}>
      {/* Placeholder until plants have photos. */}
      <View className="h-[120px] items-center justify-center rounded-2xl bg-primary">
        {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
        <SymbolView name={{ ios: 'leaf', android: 'eco', web: 'eco' }} tintColor={theme.backgroundElement} size={36} />
      </View>

      <View className="gap-1 px-2 pb-2 pt-3">
        <View>
          <Text className="type-subtitle-large text-text" numberOfLines={1}>
            {plant.name}
          </Text>
          {plant.speciesName && (
            <Text className="type-body-medium text-text-secondary" numberOfLines={1}>
              {plant.speciesName}
            </Text>
          )}
        </View>
        <View className={`mt-1 flex-row items-center gap-1 self-start rounded-full px-2.5 py-1 ${tone.pill}`}>
          <SymbolView
            name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
            tintColor={theme[tone.icon]}
            size={12}
          />
          <Text className={`type-body-medium ${tone.text}`}>{status.label}</Text>
        </View>
      </View>
    </View>
  );
}
