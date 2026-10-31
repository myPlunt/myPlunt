import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, Text, View } from 'react-native';

import { PlantPhoto } from '@/features/plants/components/plant-photo';
import { photoMonth } from '@/features/plants/growth';
import { useTheme } from '@/hooks/use-theme';
import type { PlantPhoto as PlantPhotoData } from '@/lib/plant/types';

interface PhotoCarouselProps {
  plantName: string;
  photos: PlantPhotoData[];
  fallbackUrl: string | null;
  index: number;
  onChange: (index: number) => void;
}

export function PhotoCarousel({ plantName, photos, fallbackUrl, index, onChange }: PhotoCarouselProps) {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [width, setWidth] = useState(0);
  const hasMany = photos.length > 1;

  // Follows the arrows and the Growth strip. After a swipe the page is already there, so it's a no-op.
  useEffect(() => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  }, [index, width]);

  return (
    <View
      className="aspect-square w-full overflow-hidden rounded-3xl border-[1.5px] border-input-border"
      onLayout={(event) => {
        const pageWidth = event.nativeEvent.layout.width;
        // Opens on the selected photo without sliding past the older ones first.
        scrollRef.current?.scrollTo({ x: index * pageWidth, animated: false });
        setWidth(pageWidth);
      }}>
      <ScrollView
        ref={scrollRef}
        accessibilityLabel={`Photos of ${plantName}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={hasMany}
        onMomentumScrollEnd={(event) => {
          if (width === 0) return;
          const page = Math.round(event.nativeEvent.contentOffset.x / width);
          if (page !== index) onChange(page);
        }}>
        {(photos.length > 0 ? photos : [null]).map((photo) => (
          <View key={photo?.id ?? 'fallback'} className="h-full" style={{ width }}>
            <PlantPhoto
              photoUrl={photo ? photo.url : fallbackUrl}
              accessibilityLabel={photo?.takenAt ? `Photo of ${plantName}, ${photoMonth(photo.takenAt)}` : `Photo of ${plantName}`}
              className="h-full w-full"
              iconSize={64}
            />
            {photo?.takenAt && (
              <View className="absolute left-3 top-3 rounded-full bg-background-element px-3 py-1.5">
                <Text className="type-label text-action-primary">{photoMonth(photo.takenAt)}</Text>
              </View>
            )}
            {photo?.caption && (
              <View className="absolute bottom-3 left-3 right-3 rounded-xl bg-background-element px-3 py-2">
                <Text className="type-body-medium text-text" numberOfLines={2}>
                  {photo.caption}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {hasMany && (
        <>
          <View className="absolute right-3 top-3 rounded-full bg-action-primary px-2.5 py-1.5">
            <Text className="type-label text-background-element">{`${index + 1} / ${photos.length}`}</Text>
          </View>
          <Arrow direction="previous" disabled={index === 0} onPress={() => onChange(index - 1)} />
          <Arrow direction="next" disabled={index === photos.length - 1} onPress={() => onChange(index + 1)} />
        </>
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
      className={`absolute top-1/2 -mt-[22px] h-11 w-11 items-center justify-center rounded-full bg-background-element active:opacity-70 ${
        isPrevious ? 'left-3' : 'right-3'
      } ${disabled ? 'opacity-40' : ''}`}>
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
