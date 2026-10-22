import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { CommentCount } from '@/features/feed/components/comment-count';
import { WaterDrop, countsLabel } from '@/features/feed/components/water-drop';
import { PlantPhoto } from '@/features/plants/components/plant-photo';
import { logAction } from '@/lib/logger';
import type { PlantPost } from '@/lib/post/types';

export function FeedPlantCard({ post, hideAuthor = false }: { post: PlantPost; hideAuthor?: boolean }) {
  const router = useRouter();
  const isOwn = post.author.friendship === null;
  const who = isOwn ? 'You' : post.author.username;
  const kind = post.type === 'new_photo' ? 'new photo' : 'new plant';

  return (
    <Pressable
      accessibilityRole="button"
      // The card is one element to a screen reader, so the comment and the counts go in its label.
      accessibilityLabel={`${post.body ? `${post.plantName}: ${post.body}` : post.plantName}, ${countsLabel(post)}`}
      accessibilityHint="Opens the post"
      onPress={() => {
        logAction('post_opened', { context: { post_id: post.id, post_type: post.type } });
        router.push({ pathname: '/post/[id]', params: { id: post.id } });
      }}
      className="w-full rounded-2xl bg-background-element p-1.5 active:opacity-70"
      style={Shadow.card}>
      <Text className="type-label px-1 pb-1.5 pt-0.5 uppercase text-accent" numberOfLines={1}>
        {hideAuthor ? kind : `${who} · ${kind}`}
      </Text>
      <PlantPhoto
        photoUrl={post.photoUrl}
        accessibilityLabel={`Photo of ${post.plantName}`}
        className="aspect-square w-full rounded-xl"
        iconSize={24}
      />
      <Text className="type-subtitle-small px-1 pb-0.5 pt-1.5 text-text" numberOfLines={1}>
        {post.plantName}
      </Text>
      {post.body && (
        <Text className="type-body-medium px-1 pb-1 text-text-secondary" numberOfLines={4}>
          {post.body}
        </Text>
      )}
      <View className="px-1 pb-1">
        <View className="flex-row gap-3">
          <CommentCount count={post.commentCount} />
          <WaterDrop post={post} />
        </View>
      </View>
    </Pressable>
  );
}
