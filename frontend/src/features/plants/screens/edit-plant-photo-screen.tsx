import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { NotebookPage } from '@/features/plants/components/notebook-page';
import { boxHeight, oneLine, RULE_HEIGHT, RuledLine, RuledTextField } from '@/features/plants/components/notebook-paper';
import { PlantPhoto } from '@/features/plants/components/plant-photo';
import { TakenOnField } from '@/features/plants/components/taken-on-field';
import { CAPTION_MAX_LENGTH } from '@/features/plants/growth';
import { usePlantActions } from '@/features/plants/use-plant-actions';
import { usePlantPhotos } from '@/features/plants/use-plant-photos';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, describeError } from '@/lib/auth/api-client';
import { logFailedUi } from '@/lib/logger';
import type { PlantPhoto as PlantPhotoData } from '@/lib/plant/types';

const PHOTO_ROWS = 6;

export function EditPlantPhotoScreen({ plantId, photoId }: { plantId: string; photoId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const { photos, error, isLoading, retry } = usePlantPhotos(plantId);
  const photo = photos?.find((item) => item.id === photoId);

  function close() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: '/plant/[id]/growth', params: { id: plantId } });
    }
  }

  return (
    <NotebookPage title="Edit growth photo">
      {isLoading ? (
        <View className="justify-center" style={oneLine}>
          <ActivityIndicator accessibilityLabel="Loading photo" color={theme.primary} className="self-start" />
        </View>
      ) : error || !photo ? (
        <>
          <RuledLine>
            <Text className="type-body-medium text-error" numberOfLines={1} adjustsFontSizeToFit>
              {error ?? 'Photo not found'}
            </Text>
          </RuledLine>
          <View className="justify-center" style={oneLine}>
            <Button label="Try again" variant="secondary" onPress={retry} />
          </View>
        </>
      ) : (
        // Keyed, so the form fills in once and later refetches don't overwrite what the user types.
        <EditPhotoForm key={photo.id} plantId={plantId} photo={photo} onSaved={close} />
      )}
    </NotebookPage>
  );
}

function EditPhotoForm({ plantId, photo, onSaved }: { plantId: string; photo: PlantPhotoData; onSaved: () => void }) {
  const { updatePlantPhoto } = usePlantActions();
  // Photos from before the timeline have no date; saving gives them the one shown (today).
  const [takenAt, setTakenAt] = useState(photo.takenAt);
  const [caption, setCaption] = useState(photo.caption ?? '');
  const [error, setError] = useState<string | null>(null);
  const [captionError, setCaptionError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setCaptionError(undefined);
    setIsSubmitting(true);
    try {
      await updatePlantPhoto(plantId, photo.id, {
        takenAt: takenAt ?? new Date().toISOString(),
        caption: caption.trim() === '' ? null : caption,
      });
      onSaved();
    } catch (err) {
      logFailedUi('plant_photo_update_failed_ui', err, { plant_id: plantId, photo_id: photo.id });
      if (err instanceof ApiError && err.fieldErrors?.caption) {
        setCaptionError(err.fieldErrors.caption);
      } else if (!(err instanceof ApiError && err.status === 401)) {
        setError(describeError(err));
      }
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <RuledLine>
        <Text className="type-label text-text-secondary">Photo</Text>
      </RuledLine>
      <View className="justify-center" style={{ height: PHOTO_ROWS * RULE_HEIGHT }}>
        <View style={{ height: boxHeight(PHOTO_ROWS) }}>
          <PlantPhoto
            photoUrl={photo.url}
            accessibilityLabel="Growth photo"
            className="h-full w-full rounded-[10px] border-[1.5px] border-input-border"
            iconSize={32}
          />
        </View>
      </View>
      <TakenOnField takenAt={takenAt} onChange={setTakenAt} />

      <RuledTextField
        label="Note (optional)"
        rows={2}
        value={caption}
        onChangeText={setCaption}
        error={captionError}
        placeholder="A new leaf, a repot, a first bloom…"
        maxLength={CAPTION_MAX_LENGTH}
        multiline
        autoCapitalize="sentences"
        autoCorrect
      />

      <RuledLine>
        {error && (
          <Text className="type-body-medium text-error" numberOfLines={1} adjustsFontSizeToFit>
            {error}
          </Text>
        )}
      </RuledLine>
      <View className="justify-center" style={oneLine}>
        <Button label="Save changes" loading={isSubmitting} onPress={handleSubmit} style={{ height: boxHeight(1) }} />
      </View>
    </>
  );
}
