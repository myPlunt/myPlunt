import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GardenPlant } from '@/lib/garden/types';

import { WateringPill } from './watering-pill';

interface PlantCardProps {
  plant: GardenPlant;
  now: Date;
}

/** One plant in a room; pressing it opens the plant's details. */
export function PlantCard({ plant, now }: PlantCardProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={plant.name}
      accessibilityHint="Shows this plant's details"
      onPress={() => router.push({ pathname: '/plant/[id]', params: { id: plant.id } })}
      className="w-[168px] rounded-3xl bg-background-element p-2 active:opacity-70"
      // Shadow goes through style so it sets both iOS shadow* and Android elevation.
      style={Shadow.card}>
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
        <View className="mt-1">
          <WateringPill plant={plant} now={now} />
        </View>
      </View>
    </Pressable>
  );
}
