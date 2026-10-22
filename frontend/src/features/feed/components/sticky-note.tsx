import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { CommentCount } from '@/features/feed/components/comment-count';
import { WaterDrop, countsLabel } from '@/features/feed/components/water-drop';
import { noteColor, noteTilt } from '@/features/feed/note-colors';
import { PlantPhoto } from '@/features/plants/components/plant-photo';
import { logAction } from '@/lib/logger';
import type { QuestionPost } from '@/lib/post/types';

/**
 * A question in the feed as a Post-it stuck beside the stem, slightly askew, with a strip of tape.
 * Tapping it opens the post's own page. `hideAuthor` is for the user's own profile, where every
 * post is theirs: the label is just the kind.
 */
export function StickyNote({ post, hideAuthor = false }: { post: QuestionPost; hideAuthor?: boolean }) {
  const router = useRouter();
  // The feed only has the user and their friends; null friendship means it's the user's own.
  const who = hideAuthor
    ? 'Question'
    : post.author.friendship === null
      ? 'You asked'
      : `${post.author.username} asks`;
  const tilt = noteTilt(post.id);

  return (
    // Fills the slot it's given, like a plant card. Rotation and shadow are per-note values, so
    // they go through style; the shadow sets both iOS shadow* and Android elevation.
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${who}: ${post.body}, ${countsLabel(post)}`}
      accessibilityHint="Opens the post"
      onPress={() => {
        logAction('post_opened', { context: { post_id: post.id, post_type: post.type } });
        router.push({ pathname: '/post/[id]', params: { id: post.id } });
      }}
      className={`w-full gap-2 rounded-sm p-3 active:opacity-70 ${noteColor(post.id)}`}
      style={[Shadow.card, { transform: [{ rotate: `${tilt}deg` }] }]}>
      <View className="absolute -top-2 h-4 w-12 self-center bg-background-element opacity-70" />
      <Text className="type-label uppercase text-text-secondary" numberOfLines={1}>
        {who}
      </Text>
      <Text className="type-body-medium text-text" numberOfLines={6}>
        {post.body}
      </Text>
      {post.photoUrl && (
        <PlantPhoto
          photoUrl={post.photoUrl}
          accessibilityLabel={`Photo with the question: ${post.body}`}
          className="aspect-square w-full rounded-sm"
          iconSize={20}
        />
      )}
      <View className="flex-row gap-3">
        <CommentCount count={post.commentCount} />
        <WaterDrop post={post} />
      </View>
    </Pressable>
  );
}
