import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Fragment, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Shadow } from '@/constants/theme';
import { PlantPhoto } from '@/features/plants/components/plant-photo';
import { photoMonth, timeBetween } from '@/features/plants/growth';
import { usePlantActions } from '@/features/plants/use-plant-actions';
import { usePlantPhotos } from '@/features/plants/use-plant-photos';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, describeError } from '@/lib/auth/api-client';
import { logAction, logFailedUi } from '@/lib/logger';
import type { PlantPhoto as PlantPhotoData } from '@/lib/plant/types';
import { useNetworkStore } from '@/stores/network-store';

/**
 * Every growth photo of one plant, newest first, opened from "See all" in its Growth section:
 * each photo with its date and note, and how much time passed between them. Each photo
 * can be edited (date and note) or deleted from here.
 */
export function GrowthScreen({ plantId }: { plantId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const { photos, error, isLoading, retry } = usePlantPhotos(plantId);
  const { isOffline, explainOffline } = useNetworkStore();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader
          showBack
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add a new photo"
              accessibilityHint={isOffline ? "Doesn't work offline" : undefined}
              onPress={
                isOffline
                  ? () => explainOffline('Adding photos')
                  : () => router.push({ pathname: '/plant/[id]/add-photo', params: { id: plantId } })
              }
              className={`h-10 w-10 items-center justify-center rounded-full bg-action-primary active:opacity-70 ${
                isOffline ? 'opacity-40' : ''
              }`}>
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
            photos && <GrowthTimeline plantId={plantId} photos={photos} />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function GrowthTimeline({ plantId, photos: loaded }: { plantId: string; photos: PlantPhotoData[] }) {
  const router = useRouter();
  const { deletePlantPhoto } = usePlantActions();
  // Photos deleted here, hidden right away instead of reloading the whole list.
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [confirming, setConfirming] = useState<PlantPhotoData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const photos = loaded.filter((photo) => !deletedIds.includes(photo.id));
  const newestFirst = [...photos].reverse();
  const first = photos[0]?.takenAt;

  async function confirmDelete(photo: PlantPhotoData) {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deletePlantPhoto(plantId, photo.id);
      setDeletedIds((current) => [...current, photo.id]);
      setConfirming(null);
    } catch (err) {
      logFailedUi('plant_photo_delete_failed_ui', err, { plant_id: plantId, photo_id: photo.id });
      // An expired session already signed the user out (usePlantActions).
      if (!(err instanceof ApiError && err.status === 401)) {
        setDeleteError(describeError(err));
      }
    } finally {
      setIsDeleting(false);
    }
  }

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
              <GrowthEntry
                photo={photo}
                onEdit={() =>
                  router.push({ pathname: '/plant/[id]/photo/[photoId]', params: { id: plantId, photoId: photo.id } })
                }
                onDelete={() => {
                  logAction('plant_photo_delete_started', { context: { plant_id: plantId, photo_id: photo.id } });
                  setConfirming(photo);
                }}
              />
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

      <ConfirmDialog
        visible={confirming !== null}
        title="Delete this photo?"
        message="It will be removed from the plant's growth. This can't be undone."
        confirmLabel="Delete"
        onConfirm={() => confirming && confirmDelete(confirming)}
        onCancel={() => {
          logAction('plant_photo_delete_cancelled', { context: { plant_id: plantId, photo_id: confirming?.id } });
          setConfirming(null);
          setDeleteError(null);
        }}
        loading={isDeleting}
        error={deleteError}
      />
    </>
  );
}

interface GrowthEntryProps {
  photo: PlantPhotoData;
  onEdit: () => void;
  onDelete: () => void;
}

function GrowthEntry({ photo, onEdit, onDelete }: GrowthEntryProps) {
  const theme = useTheme();
  const { isOffline, explainOffline } = useNetworkStore();
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
      <View className="justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={date ? `Edit photo from ${date}` : 'Edit photo'}
          accessibilityHint={isOffline ? "Doesn't work offline" : undefined}
          onPress={isOffline ? () => explainOffline('Editing photos') : onEdit}
          className={`h-10 w-10 items-center justify-center active:opacity-70 ${isOffline ? 'opacity-40' : ''}`}>
          {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
          <SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} tintColor={theme.actionPrimary} size={18} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={date ? `Delete photo from ${date}` : 'Delete photo'}
          accessibilityHint={isOffline ? "Doesn't work offline" : undefined}
          onPress={isOffline ? () => explainOffline('Deleting photos') : onDelete}
          className={`h-10 w-10 items-center justify-center active:opacity-70 ${isOffline ? 'opacity-40' : ''}`}>
          <SymbolView name={{ ios: 'trash', android: 'delete', web: 'delete' }} tintColor={theme.error} size={18} />
        </Pressable>
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
