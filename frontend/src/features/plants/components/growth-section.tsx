import { SymbolView } from 'expo-symbols';
import { Fragment, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { PlantPhoto } from '@/features/plants/components/plant-photo';
import { timeBetween } from '@/features/plants/growth';
import { useTheme } from '@/hooks/use-theme';
import type { PlantPhoto as PlantPhotoData } from '@/lib/plant/types';

interface GrowthSectionProps {
  plantName: string;
  /** Oldest first. */
  photos: PlantPhotoData[];
  /** The photo shown in the carousel above, highlighted here. */
  selectedIndex: number;
  onSelect: (index: number) => void;
  onSeeAll: () => void;
  onAdd: () => void;
  /** Rings the Add tile, for the tour's photo step. */
  highlightAdd?: boolean;
}

/**
 * The plant's growth photos as a strip of thumbnails under its details photo, with the time
 * between each two, "See all" for the growth journal and a tile to add a new photo.
 */
export function GrowthSection({
  plantName,
  photos,
  selectedIndex,
  onSelect,
  onSeeAll,
  onAdd,
  highlightAdd = false,
}: GrowthSectionProps) {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const first = photos[0]?.takenAt;
  const last = photos.at(-1)?.takenAt;
  const span = photos.length > 1 && first && last ? timeBetween(first, last) : null;

  return (
    // Shadow goes through style so it sets both iOS shadow* and Android elevation.
    <View className="gap-3 rounded-2xl border-[1.5px] border-input-border bg-background-element p-4" style={Shadow.card}>
      <View className="flex-row items-center justify-between gap-4">
        <Text className="type-label text-accent" numberOfLines={1}>
          {span && span !== 'Same day' ? `Growing ${plantName} for ${span}` : 'GROWTH'}
        </Text>
        {photos.length > 0 && (
            <Pressable accessibilityRole="button" accessibilityLabel="See all growth photos" onPress={onSeeAll} hitSlop={8} className="active:opacity-70">
              <Text className="type-button-medium text-action-primary">See all</Text>
            </Pressable>
        )}
      </View>

      {photos.length === 0 && (
        <Text className="type-body-medium text-text-secondary">
          {`Add a photo every now and then to watch ${plantName} grow.`}
        </Text>
      )}

      {/* Only the thumbnails scroll, so Add stays in the same spot however many photos there are. */}
      <View className="flex-row items-start">
        {photos.length > 0 && (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          // Open on the newest photos, next to Add; swiping right brings in the older ones.
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          className="flex-1"
          contentContainerClassName="items-start gap-1">
          {photos.map((photo, index) => {
            const previous = photos[index - 1]?.takenAt;
            const isSelected = index === selectedIndex;
            return (
              <Fragment key={photo.id}>
                {previous && photo.takenAt && (
                  <Text className="type-caption mt-4 w-11 text-center text-primary">{`+${timeBetween(previous, photo.takenAt, true)}`}</Text>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Show photo ${index + 1} of ${photos.length}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => onSelect(index)}
                  className="items-center gap-1 active:opacity-70">
                  <View className={`rounded-xl border-[2.5px] ${isSelected ? 'border-action-primary' : 'border-background-element'}`}>
                    <PlantPhoto photoUrl={photo.url} accessibilityLabel="" className="h-12 w-12 rounded-lg" iconSize={18} />
                  </View>
                  <Text className="type-caption text-text-secondary">
                    {photo.takenAt
                      ? new Date(photo.takenAt).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
                      : ' '}
                  </Text>
                </Pressable>
              </Fragment>
            );
          })}
        </ScrollView>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add a new photo"
          onPress={onAdd}
          className={`items-center gap-1 active:opacity-70 ${photos.length > 0 ? 'ml-2' : ''}`}>
          <View className="h-[53px] w-[53px] items-center justify-center rounded-xl border-2 border-dashed border-primary">
            {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
            <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} tintColor={theme.primary} size={20} />
            {/* Around the tile rather than its border, so the strip's layout doesn't move. */}
            {highlightAdd && (
              <View pointerEvents="none" className="absolute -inset-1.5 rounded-2xl border-2 border-primary" />
            )}
          </View>
          <Text className="type-caption text-primary">Add</Text>
        </Pressable>
      </View>
    </View>
  );
}
