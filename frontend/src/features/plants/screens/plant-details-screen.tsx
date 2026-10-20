import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { LinkCard } from '@/components/ui/link-card';
import { Shadow } from '@/constants/theme';
import { WateringPill } from '@/features/garden/components/watering-pill';
import { lastWateredLabel } from '@/features/garden/watering';
import { OnboardingCard } from '@/features/onboarding/components/onboarding-card';
import { useTourBackLock } from '@/features/onboarding/use-tour-back-lock';
import { DetailRow } from '@/features/plants/components/detail-row';
import { GrowthSection } from '@/features/plants/components/growth-section';
import { PhotoCarousel } from '@/features/plants/components/photo-carousel';
import { lightOptions } from '@/features/plants/light-options';
import { usePlant } from '@/features/plants/use-plant';
import { usePlantActions } from '@/features/plants/use-plant-actions';
import { usePlantPhotos } from '@/features/plants/use-plant-photos';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, describeError } from '@/lib/auth/api-client';
import { logAction, logFailedUi } from '@/lib/logger';
import type { PlantDetails } from '@/lib/plant/types';
import { useOnboardingStore } from '@/stores/onboarding-store';

/**
 * One of the user's plants, opened from its card in the garden. The pencil opens the edit
 * screen; "Delete plant" at the bottom removes it after asking.
 */
export function PlantDetailsScreen({ plantId }: { plantId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const { plant, error, isLoading, retry } = usePlant(plantId);
  // The tour's photo step, opened here right after its first plant was saved. It only shows
  // where photos are added (most users add one with the plant anyway); "Got it" moves on to the
  // watering step in the garden. Add under Growth still works; leaving otherwise would strand
  // the card, so back, edit, history and delete are off.
  const { step, next } = useOnboardingStore();
  const isPhotoStep = step === 'photo' && !!plant;
  useTourBackLock(isPhotoStep);
  const scrollRef = useRef<ScrollView>(null);

  // During the photo step the page starts at Growth, so its ringed Add is in view above the
  // card without scrolling. Runs again if Growth moves (e.g. once the photos load).
  function showGrowth(y: number) {
    if (isPhotoStep) scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        {/* No swipe back during the photo step either, for the same reason. */}
        <Stack.Screen options={{ gestureEnabled: !isPhotoStep }} />
        <AppHeader
          showBack={!isPhotoStep}
          right={
            plant &&
            !isPhotoStep && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit plant"
                onPress={() => router.push({ pathname: '/plant/[id]/edit', params: { id: plant.id } })}
                className="h-10 w-10 items-center justify-center active:opacity-70">
                {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
                <SymbolView
                  name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                  tintColor={theme.actionPrimary}
                  size={22}
                />
              </Pressable>
            )
          }
        />

        {/* The card is placed inside this view, not the SafeAreaView: an absolute child
            ignores its parent's padding, so it would sit under the home indicator. */}
        <View className="flex-1">
          <ScrollView
            ref={scrollRef}
            // Room to scroll the page out from under the tour card.
            contentContainerClassName={`w-full max-w-content grow gap-6 self-center px-6 pt-2 ${isPhotoStep ? 'pb-72' : 'pb-8'}`}>
            {isLoading ? (
              // A colour prop, so it reads the theme instead of a class.
              <ActivityIndicator accessibilityLabel="Loading plant" color={theme.primary} className="mt-6" />
            ) : error ? (
              <View className="items-center gap-3">
                <Text className="type-body-medium text-error">{error}</Text>
                <Button label="Try again" variant="secondary" onPress={retry} />
              </View>
            ) : (
              plant && (
                <>
                  <PlantDetailsContent plant={plant} isPhotoStep={isPhotoStep} onGrowthLayout={showGrowth} />
                  <View pointerEvents={isPhotoStep ? 'none' : 'auto'}>
                    <DeletePlant plant={plant} />
                  </View>
                </>
              )
            )}
          </ScrollView>

          {isPhotoStep && plant && (
            <View className="absolute inset-x-3 bottom-3">
              <OnboardingCard
                step="photo"
                title={`Watch ${plant.name} grow`}
                body="Whenever you take a new photo of it, add it with Add under Growth. Side by side, the photos show how it grows."
                actionLabel="Got it"
                onAction={() => {
                  next();
                  router.dismissTo('/garden');
                }}
                showNotNow={false}
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

interface PlantDetailsContentProps {
  plant: PlantDetails;
  isPhotoStep: boolean;
  /** Where the Growth section starts in the page, so the photo step can scroll to it. */
  onGrowthLayout: (y: number) => void;
}

function PlantDetailsContent({ plant, isPhotoStep, onGrowthLayout }: PlantDetailsContentProps) {
  const router = useRouter();
  // Empty while loading or on an error: the carousel then falls back to the plant's own photo.
  const photos = usePlantPhotos(plant.id).photos ?? [];
  // null shows the newest photo, also after a new one was added.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const shownIndex = Math.min(selectedIndex ?? photos.length - 1, photos.length - 1);
  // Taken per render, so "Today" moves on if the screen stays open past midnight.
  const now = new Date();
  const light = lightOptions.find((option) => option.value === plant.light);
  // Without the owner's own frequency it's the species' or the 7-day fallback.
  const watering = `Every ${plant.wateringFrequencyDays} days${plant.wateringEveryDays === null ? ' (default)' : ''}`;

  return (
    <>
      {/* The name belongs to the photo, so it sits closer to it than the page's gap-6. */}
      <View className="gap-3">
        <PhotoCarousel
          plantName={plant.name}
          photos={photos}
          fallbackUrl={plant.photoUrl}
          index={shownIndex}
          onChange={setSelectedIndex}
        />

        <View>
          <Text accessibilityRole="header" className="type-h4 text-action-primary" style={styles.name}>
            {plant.name}
          </Text>
          {plant.speciesName && <Text className="type-subtitle-large text-text-secondary">{plant.speciesName}</Text>}
        </View>
      </View>

      {/* Shadow goes through style so it sets both iOS shadow* and Android elevation. */}
      <View className="gap-3 rounded-2xl border-[1.5px] border-input-border bg-background-element p-4" style={Shadow.card}>
        <Text className="type-label text-accent" numberOfLines={1}>
          {`${plant.name} information`.toUpperCase()}
        </Text>
        <DetailRow label="Planter" value={plant.planterName ?? 'Other plants'} />
        <DetailRow label="Light" value={light?.label ?? 'Not set'} />
        <DetailRow label="Watering" value={watering} />
        <DetailRow label="Last watered" value={lastWateredLabel(plant.lastWateredAt, now)} />
        <View className="flex-row items-center justify-between gap-4">
          <Text className="type-body-large text-text-secondary">Next watering</Text>
          <WateringPill plant={plant} now={now} />
        </View>
      </View>

      <View onLayout={({ nativeEvent: { layout } }) => onGrowthLayout(layout.y)}>
        <GrowthSection
          plantName={plant.name}
          photos={photos}
          selectedIndex={shownIndex}
          onSelect={setSelectedIndex}
          onSeeAll={() => router.push({ pathname: '/plant/[id]/growth', params: { id: plant.id } })}
          onAdd={() => router.push({ pathname: '/plant/[id]/add-photo', params: { id: plant.id } })}
          highlightAdd={isPhotoStep}
        />
      </View>

      <View pointerEvents={isPhotoStep ? 'none' : 'auto'}>
        <LinkCard
          title="Watering history"
          icon={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
          onPress={() => router.push({ pathname: '/plant/[id]/waterings', params: { id: plant.id } })}
        />
      </View>

      {plant.notes && (
        <View className="gap-2 rounded-2xl border-[1.5px] border-input-border bg-background-element p-4" style={Shadow.card}>
          <Text className="type-label text-accent">NOTES</Text>
          <Text className="type-body-large text-text">{plant.notes}</Text>
        </View>
      )}
    </>
  );
}

function DeletePlant({ plant }: { plant: PlantDetails }) {
  const router = useRouter();
  const { deletePlant } = usePlantActions();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setIsDeleting(true);
    setError(null);
    try {
      await deletePlant(plant.id);
      setIsConfirming(false);
      // Back to the garden, which reloads on focus and no longer lists the plant. Nothing
      // underneath when the app was opened straight onto this page, so go there directly.
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/garden');
      }
    } catch (err) {
      logFailedUi('plant_delete_failed_ui', err, { plant_id: plant.id });
      // An expired session already signed the user out (usePlantActions).
      if (!(err instanceof ApiError && err.status === 401)) {
        setError(describeError(err));
      }
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete plant"
        onPress={() => {
          logAction('plant_delete_started', { context: { plant_id: plant.id } });
          setIsConfirming(true);
        }}
        className="items-center py-2 active:opacity-70">
        <Text className="type-button-medium text-error">Delete plant</Text>
      </Pressable>
      <ConfirmDialog
        visible={isConfirming}
        title={`Delete ${plant.name}?`}
        message="It will be removed from your garden with its photos and watering history. This can't be undone."
        confirmLabel="Delete"
        onConfirm={confirm}
        onCancel={() => {
          logAction('plant_delete_cancelled', { context: { plant_id: plant.id } });
          setIsConfirming(false);
          setError(null);
        }}
        loading={isDeleting}
        error={error}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Lateef's natural line is ~1.45× its size; a shorter line height (type-h4's 40) clips
  // the bottom of the glyphs on iOS. Android's extra font padding is dropped so both
  // platforms place it the same. The full-height line leaves empty space above the
  // capitals, so the negative margin pulls them up towards the photo. A style, because
  // a leading-* class loses to type-h4.
  name: {
    lineHeight: 46,
    marginTop: -6,
    includeFontPadding: false,
  },
});
