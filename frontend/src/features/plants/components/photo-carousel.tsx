import { SymbolView } from 'expo-symbols';
import { Pressable, Text, View } from 'react-native';

import { PlantPhoto } from '@/features/plants/components/plant-photo';
import { photoMonth } from '@/features/plants/growth';
import { useTheme } from '@/hooks/use-theme';
import type { PlantPhoto as PlantPhotoData } from '@/lib/plant/types';

interface PhotoCarouselProps {
  plantName: string;
  /** The growth photos, oldest first; empty while they load or when there are none. */
  photos: PlantPhotoData[];
  /** Shown when `photos` is empty: the plant's current photo from its details, or null. */
  fallbackUrl: string | null;
  index: number;
  onChange: (index: number) => void;
}

/**
 * The big photo on a plant's details, with arrows to step through its growth photos, the
 * month it was taken, how far along the timeline it is, and its note.
 */
export function PhotoCarousel({ plantName, photos, fallbackUrl, index, onChange }: PhotoCarouselProps) {
  const photo = photos[index];
  const hasMany = photos.length > 1;

  return (
    <View className="aspect-square w-full">
      <PlantPhoto
        photoUrl={photo?.url ?? fallbackUrl}
        accessibilityLabel={photo?.takenAt ? `Photo of ${plantName}, ${photoMonth(photo.takenAt)}` : `Photo of ${plantName}`}
        className="h-full w-full rounded-3xl border-[1.5px] border-input-border"
        iconSize={64}
      />

      {photo?.takenAt && (
        <View className="absolute left-3 top-3 rounded-full bg-background-element px-3 py-1.5">
          <Text className="type-label text-action-primary">{photoMonth(photo.takenAt)}</Text>
        </View>
      )}
      {hasMany && (
        <>
          <View className="absolute right-3 top-3 rounded-full bg-action-primary px-2.5 py-1.5">
            <Text className="type-label text-background-element">{`${index + 1} / ${photos.length}`}</Text>
          </View>
          <Arrow direction="previous" disabled={index === 0} onPress={() => onChange(index - 1)} />
          <Arrow direction="next" disabled={index === photos.length - 1} onPress={() => onChange(index + 1)} />
        </>
      )}
      {photo?.caption && (
        <View className="absolute bottom-3 left-3 right-3 rounded-xl bg-background-element px-3 py-2">
          <Text className="type-body-medium text-text" numberOfLines={2}>
            {photo.caption}
          </Text>
        </View>
      )}
    </View>
  );
}

function Arrow({ direction, disabled, onPress }: { direction: 'previous' | 'next'; disabled: boolean; onPress: () => void }) {
  const theme = useTheme();
  const isPrevious = direction === 'previous';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isPrevious ? 'Previous photo' : 'Next photo'}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      // Vertically centred: top-1/2 puts the top edge in the middle, -mt-[22px] lifts it by half its height.
      className={`absolute top-1/2 -mt-[22px] h-11 w-11 items-center justify-center rounded-full bg-background-element active:opacity-70 ${
        isPrevious ? 'left-3' : 'right-3'
      } ${disabled ? 'opacity-40' : ''}`}>
      {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
      <SymbolView
        name={
          isPrevious
            ? { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }
            : { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }
        }
        tintColor={theme.actionPrimary}
        size={18}
      />
    </Pressable>
  );
}
