import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Shadow } from '@/constants/theme';
import { COMMENT_MAX_LENGTH, QUESTION_MAX_LENGTH } from '@/features/feed/post-limits';
import { useFeedActions } from '@/features/feed/use-feed-actions';
import { ApiError, describeError } from '@/lib/auth/api-client';
import { logAction, logFailedUi } from '@/lib/logger';
import type { Post } from '@/lib/post/types';

interface EditPostDialogProps {
  post: Post;
  mode: 'edit' | 'delete';
  onClose: () => void;
  onSaved: (post: Post) => void;
  onDeleted: () => void;
}

export function EditPostDialog({ post, mode, onClose, onSaved, onDeleted }: EditPostDialogProps) {
  const { updatePost, deletePost } = useFeedActions();
  const [body, setBody] = useState(post.body ?? '');
  const [isBusy, setIsBusy] = useState(false);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isQuestion = post.type === 'question';
  const trimmed = body.trim();
  const canSave = trimmed !== (post.body ?? '') && (!isQuestion || trimmed !== '');

  function close() {
    if (!isBusy) onClose();
  }

  function showError(err: unknown) {
    if (err instanceof ApiError && err.status === 401) return;
    const fieldError = err instanceof ApiError ? err.fieldErrors?.body : undefined;
    if (fieldError) {
      setBodyError(fieldError);
    } else {
      setError(describeError(err));
    }
  }

  async function save() {
    setBodyError(null);
    setError(null);
    setIsBusy(true);
    try {
      onSaved(await updatePost(post.id, { body: trimmed === '' ? null : trimmed }));
    } catch (err) {
      logFailedUi('post_update_failed_ui', err, { post_id: post.id });
      showError(err);
      setIsBusy(false);
    }
  }

  async function confirmDelete() {
    setError(null);
    setIsBusy(true);
    try {
      await deletePost(post.id);
      onDeleted();
    } catch (err) {
      logFailedUi('post_delete_failed_ui', err, { post_id: post.id });
      showError(err);
      setIsBusy(false);
    }
  }

  const deleteLine = isQuestion
    ? "It's removed from your friends' feeds, with its photo. This can't be undone."
    : "It's removed from your friends' feeds, the plant and its photos stay in your garden. This can't be undone.";

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="flex-1 items-center justify-center px-6">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={close}
            className="absolute inset-0 bg-text opacity-40"
          />
          <View className="w-full max-w-[360px] gap-3 rounded-2xl bg-background-element p-5" style={Shadow.card}>
            {mode === 'delete' ? (
              <>
                <Text accessibilityRole="header" className="type-subtitle-large text-text">
                  Delete this post?
                </Text>
                <Text className="type-body-medium text-text-secondary">{deleteLine}</Text>
                {error && <Text className="type-body-medium text-error">{error}</Text>}
                <View className="mt-2 flex-row justify-center gap-3">
                  <Button
                    label="Cancel"
                    variant="secondary"
                    disabled={isBusy}
                    style={{ borderWidth: 0 }}
                    onPress={() => {
                      logAction('post_delete_cancelled', { context: { post_id: post.id } });
                      close();
                    }}
                  />
                  <Button label="Delete" variant="destructive" loading={isBusy} onPress={confirmDelete} />
                </View>
              </>
            ) : (
              <>
                <Text accessibilityRole="header" className="type-subtitle-large text-text">
                  {isQuestion ? 'Edit question' : 'Edit comment'}
                </Text>
                <FormField
                  label={isQuestion ? 'Question' : 'Comment (optional)'}
                  value={body}
                  onChangeText={setBody}
                  error={bodyError ?? undefined}
                  maxLength={isQuestion ? QUESTION_MAX_LENGTH : COMMENT_MAX_LENGTH}
                  multiline
                  autoCapitalize="sentences"
                  autoCorrect
                />
                {error && <Text className="type-body-medium text-error">{error}</Text>}
                <View className="flex-row justify-center gap-3">
                  <Button
                    label="Cancel"
                    variant="secondary"
                    disabled={isBusy}
                    onPress={close}
                    style={{ borderWidth: 0 }}
                  />
                  <Button label="Save" loading={isBusy} disabled={!canSave} onPress={save} />
                </View>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
