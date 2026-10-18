import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Fragment } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Shadow } from '@/constants/theme';
import { PlantPhoto } from '@/features/plants/components/plant-photo';
import { photoMonth, timeBetween } from '@/features/plants/growth';
import { usePlantPhotos } from '@/features/plants/use-plant-photos';
import { useTheme } from '@/hooks/use-theme';
import type { PlantPhoto as PlantPhotoData } from '@/lib/plant/types';

/**
 * Every growth photo of one plant, newest first, opened from "See all" in its Growth section:
 * each photo with its date and note, and how much time passed between them.
 */
export function GrowthScreen({ plantId }: { plantId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const { photos, error, isLoading, retry } = usePlantPhotos(plantId);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader
          showBack
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add a growth photo"
              onPress={() => router.push({ pathname: '/plant/[id]/add-photo', params: { id: plantId } })}
              className="h-10 w-10 items-center justify-center rounded-full bg-action-primary active:opacity-70">
              {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
              <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} tintColor={theme.backgroundElement} size={20} />
            </Pressable>
          }
        />

        <ScrollView contentContainerClassName="w-full max-w-content grow gap-6 self-center px-6 pb-8 pt-2">
          {isLoading ? (
            // A colour prop, so it reads the theme instead of a class.
            <ActivityIndicator accessibilityLabel="Loading photos" color={theme.primary} className="mt-6" />
          ) : error ? (
            <View className="items-center gap-3">
              <Text className="type-body-medium text-error">{error}</Text>
              <Button label="Try again" variant="secondary" onPress={retry} />
            </View>
          ) : (
            photos && <GrowthTimeline photos={photos} />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function GrowthTimeline({ photos }: { photos: PlantPhotoData[] }) {
  const newestFirst = [...photos].reverse();
  const first = photos[0]?.takenAt;

  return (
    <>
      <View>
        <Text accessibilityRole="header" className="type-h3 text-action-primary" style={styles.title}>
          Growth
        </Text>
        <Text className="type-subtitle-large text-text-secondary">
          {`${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}${first ? ` since ${photoMonth(first)}` : ''}`}
        </Text>
      </View>

      <View>
        {newestFirst.map((photo, index) => {
          const older = newestFirst[index + 1]?.takenAt;
          return (
            <Fragment key={photo.id}>
              <GrowthEntry photo={photo} />
              {older && photo.takenAt && (
                // The pill is a View: iOS doesn't round a Text's own background.
                <View className="items-center py-3">
                  <View className="rounded-full bg-background-element px-3 py-1">
                    <Text className="type-label text-primary">{`${timeBetween(older, photo.takenAt)} later`}</Text>
                  </View>
                </View>
              )}
            </Fragment>
          );
        })}
      </View>
    </>
  );
}

function GrowthEntry({ photo }: { photo: PlantPhotoData }) {
  const date = photo.takenAt
    ? new Date(photo.takenAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    // Shadow goes through style so it sets both iOS shadow* and Android elevation.
    <View className="flex-row gap-4 rounded-2xl border-[1.5px] border-input-border bg-background-element p-3" style={Shadow.card}>
      <PlantPhoto
        photoUrl={photo.url}
        accessibilityLabel={date ? `Photo from ${date}` : 'Photo'}
        className="h-28 w-28 rounded-xl"
        iconSize={32}
      />
      <View className="flex-1 gap-1 pt-1">
        {date && <Text className="type-subtitle-small text-text">{date}</Text>}
        {photo.caption && <Text className="type-body-medium text-text">{photo.caption}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Same as the watering history's title: Lateef needs a taller line than type-h3's, or iOS
  // clips the bottom of the glyphs, and Android's extra font padding is dropped so both
  // platforms place it the same. A style, because a leading-* class loses to type-h3.
  title: {
    lineHeight: 58,
    includeFontPadding: false,
  },
});
