import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Shadow } from '@/constants/theme';
import { NOTE_COLORS } from '@/features/feed/note-colors';
import { QUESTION_MAX_LENGTH } from '@/features/feed/post-limits';
import { useFeedActions } from '@/features/feed/use-feed-actions';
import { usePhotoUpload } from '@/features/photos/use-photo-upload';
import { NotebookPage } from '@/features/plants/components/notebook-page';
import { boxHeight, oneLine, RULE_HEIGHT, RuledLine } from '@/features/plants/components/notebook-paper';
import { PhotoField } from '@/features/plants/components/photo-field';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, describeError } from '@/lib/auth/api-client';
import { logFailedUi } from '@/lib/logger';

// Same limit as the backend's AskQuestionRequest.
// The note covers this many ruled lines, so everything below stays on the grid.
const NOTE_ROWS = 4;

/**
 * Asks the user's friends a question, opened from "I have a question" on the feed: the question
 * is written on a sticky note stuck to the notebook paper, with an optional photo below.
 */
export function AskQuestionScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { askQuestion } = useFeedActions();
  const photo = usePhotoUpload('POST');
  // shortcut: the colour here is only for writing; in the feed each note gets its own colour
  // from its id. Store the colour on the post if they should match.
  const [color] = useState(() => NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]);
  const [question, setQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [questionError, setQuestionError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function close() {
    // Nothing underneath when the app was opened straight onto this page, so go to the feed,
    // where the new note shows up.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  async function handleSubmit() {
    setError(null);
    setQuestionError(undefined);
    setIsSubmitting(true);
    try {
      await askQuestion({ body: question, photoKey: photo.key });
      close();
    } catch (err) {
      logFailedUi('question_ask_failed_ui', err);
      if (err instanceof ApiError && err.fieldErrors?.body) {
        setQuestionError(err.fieldErrors.body);
      } else if (!(err instanceof ApiError && err.status === 401)) {
        // An expired session already signed the user out (useFeedActions).
        setError(describeError(err));
      }
      setIsSubmitting(false);
    }
  }

  return (
    <NotebookPage title="Ask your friends">
      <RuledLine>
        <Text className="type-body-medium text-text-secondary" numberOfLines={1} adjustsFontSizeToFit>
          Stuck with a plant? Your friends can help.
        </Text>
      </RuledLine>

      {/* The note's height comes from the grid, so it can't be a static class. Shadow goes
          through style so it sets both iOS shadow* and Android elevation. */}
      <View className="justify-center" style={{ height: NOTE_ROWS * RULE_HEIGHT }}>
        <View className={`-rotate-1 rounded-sm p-3 ${color}`} style={[Shadow.card, { height: boxHeight(NOTE_ROWS) }]}>
          <TextInput
            accessibilityLabel="Your question"
            value={question}
            onChangeText={setQuestion}
            placeholder="Why are my leaves turning red?"
            // A colour prop, not a style, so it can't take a class.
            placeholderTextColor={theme.textSecondary}
            maxLength={QUESTION_MAX_LENGTH}
            multiline
            autoCapitalize="sentences"
            autoCorrect
            className="type-body-large flex-1 text-text"
            // Android centres multiline text vertically by default; start at the top like iOS.
            style={{ textAlignVertical: 'top' }}
          />
        </View>
      </View>
      {questionError && (
        <RuledLine>
          <Text className="type-caption text-error" numberOfLines={1} adjustsFontSizeToFit>
            {questionError}
          </Text>
        </RuledLine>
      )}

      <PhotoField photo={photo} />

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
            label="Stick it on the vine"
            loading={isSubmitting}
            // The photo has to finish uploading first, or it would be left out.
            disabled={question.trim() === '' || photo.isUploading}
            onPress={handleSubmit}
            style={{ height: boxHeight(1) }}
          />
        </View>
      </View>
    </NotebookPage>
  );
}
