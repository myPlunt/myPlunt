import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { UserAvatar } from '@/components/user/user-avatar';
import { POST_COMMENT_MAX_LENGTH } from '@/features/feed/post-limits';
import { useFeedActions } from '@/features/feed/use-feed-actions';
import { ApiError, describeError } from '@/lib/auth/api-client';
import { logFailedUi } from '@/lib/logger';
import type { PostComment } from '@/lib/post/types';

interface PostCommentsProps {
  postId: string;
  comments: PostComment[];
  onAdded: (comment: PostComment) => void;
}

export function PostComments({ postId, comments, onAdded }: PostCommentsProps) {
  const { addComment } = useFeedActions();
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = body.trim();

  async function send() {
    setError(null);
    setIsSending(true);
    try {
      onAdded(await addComment(postId, { body: trimmed }));
      setBody('');
    } catch (err) {
      logFailedUi('comment_add_failed_ui', err, { post_id: postId });
      if (!(err instanceof ApiError && err.status === 401)) {
        setError((err instanceof ApiError && err.fieldErrors?.body) || describeError(err));
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <View className="mt-4 gap-4">
      <Text accessibilityRole="header" className="type-h5 text-text">
        Comments
      </Text>
      {comments.length === 0 ? (
        <Text className="type-body-medium text-text-secondary">No comments yet. Be the first!</Text>
      ) : (
        comments.map((comment) => (
          <View key={comment.id} className="flex-row gap-3">
            <UserAvatar
              size={32}
              url={comment.author.avatarUrl}
              accessibilityLabel={`${comment.author.username}'s profile picture`}
            />
            <View className="flex-1">
              <Text className="type-subtitle-small text-text">{comment.author.username}</Text>
              <Text className="type-body-medium text-text">{comment.body}</Text>
              <Text className="type-caption text-text-secondary">
                {new Date(comment.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
              </Text>
            </View>
          </View>
        ))
      )}
      <View>
        <FormField
          label="Add a comment"
          value={body}
          onChangeText={setBody}
          error={error ?? undefined}
          maxLength={POST_COMMENT_MAX_LENGTH}
          multiline
          autoCapitalize="sentences"
          autoCorrect
        />
        <View className="items-end">
          <Button label="Send" loading={isSending} disabled={trimmed === ''} onPress={send} />
        </View>
      </View>
    </View>
  );
}
