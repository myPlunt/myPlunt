import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { PlantPhoto } from '@/features/plants/components/plant-photo';
import { useTheme } from '@/hooks/use-theme';
import type { GardenPlant } from '@/lib/garden/types';

import { WateringPill } from './watering-pill';

interface PlantSelection {
  selected: boolean;
  onToggle: () => void;
}

interface PlantCardProps {
  plant: GardenPlant;
  now: Date;
  /** Set while the user picks plants to water: pressing the card then toggles it instead of opening it. */
  selection?: PlantSelection;
}

/** One plant in a room; pressing it opens the plant's details, or selects it while picking plants to water. */
export function PlantCard({ plant, now, selection }: PlantCardProps) {
  const router = useRouter();
  const theme = useTheme();
  const selected = selection?.selected ?? false;

  return (
    <Pressable
      {...(selection
        ? {
            accessibilityRole: 'checkbox',
            accessibilityState: { checked: selected },
            accessibilityHint: 'Selects this plant for watering',
            onPress: selection.onToggle,
          }
        : {
            accessibilityRole: 'button',
            accessibilityHint: "Shows this plant's details",
            onPress: () => router.push({ pathname: '/plant/[id]', params: { id: plant.id } }),
          })}
      accessibilityLabel={plant.name}
      // The border is always there (transparent when unselected) so selecting doesn't shift the card.
      className={`w-[168px] rounded-3xl border-2 bg-background-element p-2 active:opacity-70 ${
        selected ? 'border-action-primary' : 'border-transparent'
      }`}
      // Shadow goes through style so it sets both iOS shadow* and Android elevation.
      style={Shadow.card}>
      {/* Square, like every plant photo (they're cropped to a square when picked), so none of it is cut off. */}
      <PlantPhoto
        photoUrl={plant.photoUrl}
        accessibilityLabel={`Photo of ${plant.name}`}
        className="aspect-square w-full rounded-2xl"
        iconSize={36}
      />
      {selection && (
        <View
          className={`absolute right-4 top-4 h-7 w-7 items-center justify-center rounded-full border-2 border-background-element ${
            selected ? 'bg-action-primary' : 'bg-background-element/70'
          }`}>
          {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
          {selected && (
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              tintColor={theme.backgroundElement}
              size={14}
            />
          )}
        </View>
      )}

      <View className="gap-1 px-2 pb-2 pt-3">
        <View>
          <Text className="type-subtitle-large text-text" numberOfLines={1}>
            {plant.name}
          </Text>
          {/* Always one line, left blank without a species, so the watering pill sits at the
              same height on every card. The blank line is hidden from screen readers. */}
          <Text
            className="type-body-medium text-text-secondary"
            numberOfLines={1}
            accessibilityElementsHidden={!plant.speciesName}
            importantForAccessibility={plant.speciesName ? 'auto' : 'no-hide-descendants'}>
            {plant.speciesName ?? ' '}
          </Text>
        </View>
        <View className="mt-1">
          <WateringPill plant={plant} now={now} />
        </View>
      </View>
    </Pressable>
  );
}
