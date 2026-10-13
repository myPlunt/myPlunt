import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Shadow } from '@/constants/theme';
import { WateringPill } from '@/features/garden/components/watering-pill';
import { lastWateredLabel } from '@/features/garden/watering';
import { DetailRow } from '@/features/plants/components/detail-row';
import { PlantPhoto } from '@/features/plants/components/plant-photo';
import { lightOptions } from '@/features/plants/light-options';
import { usePlant } from '@/features/plants/use-plant';
import { usePlantActions } from '@/features/plants/use-plant-actions';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, describeError } from '@/lib/auth/api-client';
import type { PlantDetails } from '@/lib/plant/types';

/**
 * One of the user's plants, opened from its card in the garden. The pencil opens the edit
 * screen; "Delete plant" at the bottom removes it after asking.
 */
export function PlantDetailsScreen({ plantId }: { plantId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const { plant, error, isLoading, retry } = usePlant(plantId);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader
          showBack
          right={
            plant && (
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

        <ScrollView contentContainerClassName="w-full max-w-content grow gap-6 self-center px-6 pb-8 pt-2">
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
                <PlantDetailsContent plant={plant} />
                <DeletePlant plant={plant} />
              </>
            )
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function PlantDetailsContent({ plant }: { plant: PlantDetails }) {
  const router = useRouter();
  // Taken per render, so "Today" moves on if the screen stays open past midnight.
  const now = new Date();
  const light = lightOptions.find((option) => option.value === plant.light);
  // Without the owner's own frequency it's the species' or the 7-day fallback.
  const watering = `Every ${plant.wateringFrequencyDays} days${plant.wateringEveryDays === null ? ' (default)' : ''}`;

  return (
    <>
      {/* The name belongs to the photo, so it sits closer to it than the page's gap-6. */}
      <View className="gap-3">
        <PlantPhoto
          photoUrl={plant.photoUrl}
          accessibilityLabel={`Photo of ${plant.name}`}
          className="aspect-square w-full rounded-3xl border-[1.5px] border-input-border"
          iconSize={64}
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

      <Button
        label="Watering history"
        variant="secondary"
        onPress={() => router.push({ pathname: '/plant/[id]/waterings', params: { id: plant.id } })}
      />

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
        onPress={() => setIsConfirming(true)}
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
