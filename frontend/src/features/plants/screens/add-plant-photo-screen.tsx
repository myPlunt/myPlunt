import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { usePhotoUpload } from '@/features/photos/use-photo-upload';
import { NotebookPage } from '@/features/plants/components/notebook-page';
import { boxHeight, oneLine, RuledLine, RuledTextField } from '@/features/plants/components/notebook-paper';
import { PhotoField } from '@/features/plants/components/photo-field';
import { usePlantActions } from '@/features/plants/use-plant-actions';
import { ApiError, describeError } from '@/lib/auth/api-client';
import { logFailedUi } from '@/lib/logger';

// Same limit as the backend's AddPlantPhotoRequest.
const CAPTION_MAX_LENGTH = 280;

/**
 * Adds a photo to a plant's growth timeline, opened from "Add" in its Growth section: the
 * photo (camera or library), the date it was taken and an optional note.
 */
export function AddPlantPhotoScreen({ plantId }: { plantId: string }) {
  const router = useRouter();
  const { addPlantPhoto } = usePlantActions();
  const photo = usePhotoUpload('PLANT');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [captionError, setCaptionError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function close() {
    // Nothing underneath when the app was opened straight onto this page, so go to the
    // plant's details, which show the new photo.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: '/plant/[id]', params: { id: plantId } });
    }
  }

  async function handleSubmit() {
    // The button is disabled until the upload is done, so the key is there.
    if (!photo.key) return;
    setError(null);
    setCaptionError(undefined);
    setIsSubmitting(true);
    try {
      await addPlantPhoto(plantId, {
        photoKey: photo.key,
        takenAt: photo.takenAt,
        caption: caption.trim() === '' ? null : caption,
      });
      close();
    } catch (err) {
      logFailedUi('plant_photo_add_failed_ui', err, { plant_id: plantId });
      if (err instanceof ApiError && err.fieldErrors?.caption) {
        setCaptionError(err.fieldErrors.caption);
      } else if (!(err instanceof ApiError && err.status === 401)) {
        // An expired session already signed the user out (usePlantActions).
        setError(describeError(err));
      }
      setIsSubmitting(false);
    }
  }

  // Without a date from the photo's metadata the backend uses now (e.g. a camera photo).
  const takenOn = (photo.takenAt ? new Date(photo.takenAt) : new Date()).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <NotebookPage title="Add a growth photo">
      <RuledLine>
        <Text className="type-body-medium text-text-secondary" numberOfLines={1} adjustsFontSizeToFit>
          Snap how your plant looks today.
        </Text>
      </RuledLine>

      <PhotoField photo={photo} />
      {photo.uri && (
        <RuledLine>
          <Text className="type-body-medium text-text-secondary" numberOfLines={1}>
            {`Taken on ${takenOn}`}
          </Text>
        </RuledLine>
      )}

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

      {/* One line before the button, which shows the error, if any. */}
      <RuledLine>
        {error && (
          <Text className="type-body-medium text-error" numberOfLines={1} adjustsFontSizeToFit>
            {error}
          </Text>
        )}
      </RuledLine>
      {/* A disabled button is see-through (opacity), so the paper-coloured backing keeps
          the ruled lines from showing through it (as in the plant form). */}
      <View className="justify-center" style={oneLine}>
        <View className="rounded-[10px] bg-background-element">
          <Button
            label="Add to timeline"
            loading={isSubmitting}
            disabled={!photo.key}
            onPress={handleSubmit}
            style={{ height: boxHeight(1) }}
          />
        </View>
      </View>
    </NotebookPage>
  );
}
