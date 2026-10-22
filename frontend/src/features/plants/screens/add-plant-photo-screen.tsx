import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { COMMENT_MAX_LENGTH } from '@/features/feed/post-limits';
import { usePhotoUpload } from '@/features/photos/use-photo-upload';
import { NotebookPage } from '@/features/plants/components/notebook-page';
import { boxHeight, oneLine, RuledLine, RuledTextField } from '@/features/plants/components/notebook-paper';
import { PhotoField } from '@/features/plants/components/photo-field';
import { ShareToFeedCheckbox } from '@/features/plants/components/share-to-feed-checkbox';
import { TakenOnField } from '@/features/plants/components/taken-on-field';
import { usePlantActions } from '@/features/plants/use-plant-actions';
import { ApiError, describeError } from '@/lib/auth/api-client';
import { logFailedUi } from '@/lib/logger';
import { useOnboardingStore } from '@/stores/onboarding-store';

export function AddPlantPhotoScreen({ plantId }: { plantId: string }) {
  const router = useRouter();
  const { addPlantPhoto } = usePlantActions();
  const { step, next } = useOnboardingStore();
  const photo = usePhotoUpload('PLANT');
  // A date the user picked, for the photo it was picked for: picking another photo brings
  // back that photo's own date.
  const [pickedDate, setPickedDate] = useState<{ uri: string; takenAt: string } | null>(null);
  const [comment, setComment] = useState('');
  const [shareToFeed, setShareToFeed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function close() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: '/plant/[id]', params: { id: plantId } });
    }
  }

  // From the user, else the photo's metadata, else null: the backend then uses now (e.g. a camera photo).
  const takenAt = pickedDate && pickedDate.uri === photo.uri ? pickedDate.takenAt : photo.takenAt;

  async function handleSubmit() {
    // The button is disabled until the upload is done, so the key is there.
    if (!photo.key) return;
    setError(null);
    setCommentError(undefined);
    setIsSubmitting(true);
    try {
      await addPlantPhoto(plantId, {
        photoKey: photo.key,
        takenAt,
        // The comment is only for the post; unticking share drops what was typed.
        comment: shareToFeed && comment.trim() !== '' ? comment : null,
        shareToFeed,
      });
      if (step === 'photo') {
        next();
        router.dismissTo('/garden');
        return;
      }
      close();
    } catch (err) {
      logFailedUi('plant_photo_add_failed_ui', err, { plant_id: plantId });
      if (err instanceof ApiError && err.fieldErrors?.comment) {
        setCommentError(err.fieldErrors.comment);
      } else if (!(err instanceof ApiError && err.status === 401)) {
        setError(describeError(err));
      }
      setIsSubmitting(false);
    }
  }

  return (
    <NotebookPage title="Add a new photo">
      <RuledLine>
        <Text className="type-body-medium text-text-secondary" numberOfLines={1} adjustsFontSizeToFit>
          Show how your plant looks today.
        </Text>
      </RuledLine>

      <PhotoField photo={photo} />
      {photo.uri && (
        <TakenOnField
          takenAt={takenAt}
          onChange={(picked) => photo.uri && setPickedDate({ uri: photo.uri, takenAt: picked })}
        />
      )}

      <ShareToFeedCheckbox checked={shareToFeed} onChange={setShareToFeed} />

      {shareToFeed && (
        <RuledTextField
          label="Comment (optional)"
          rows={2}
          value={comment}
          onChangeText={setComment}
          error={commentError}
          placeholder="Omg, a new flower is blooming!"
          maxLength={COMMENT_MAX_LENGTH}
          multiline
          autoCapitalize="sentences"
          autoCorrect
        />
      )}

      <RuledLine>
        {error && (
          <Text className="type-body-medium text-error" numberOfLines={1} adjustsFontSizeToFit>
            {error}
          </Text>
        )}
      </RuledLine>
      {/* Backs the see-through disabled button, so the ruled lines don't show through it. */}
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
