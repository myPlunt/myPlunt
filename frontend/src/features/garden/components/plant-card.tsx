import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { PlantPhoto } from '@/features/plants/components/plant-photo';
import type { GardenPlant } from '@/lib/garden/types';

import { WateringPill } from './watering-pill';

interface PlantCardProps {
  plant: GardenPlant;
  now: Date;
}

/** One plant in a room; pressing it opens the plant's details. */
export function PlantCard({ plant, now }: PlantCardProps) {
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
      {/* Square, like every plant photo (they're cropped to a square when picked), so none of it is cut off. */}
      <PlantPhoto
        photoUrl={plant.photoUrl}
        accessibilityLabel={`Photo of ${plant.name}`}
        className="aspect-square w-full rounded-2xl"
        iconSize={36}
      />

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
