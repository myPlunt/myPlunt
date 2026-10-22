import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { CommentCount } from '@/features/feed/components/comment-count';
import { WaterDrop, countsLabel } from '@/features/feed/components/water-drop';
import { noteColor, noteTilt } from '@/features/feed/note-colors';
import { PlantPhoto } from '@/features/plants/components/plant-photo';
import { logAction } from '@/lib/logger';
import type { QuestionPost } from '@/lib/post/types';

export function StickyNote({ post, hideAuthor = false }: { post: QuestionPost; hideAuthor?: boolean }) {
  const router = useRouter();
  const who = hideAuthor
    ? 'Question'
    : post.author.friendship === null
      ? 'You asked'
      : `${post.author.username} asks`;
  const tilt = noteTilt(post.id);

  return (
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
