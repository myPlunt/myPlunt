import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { CommentCount, commentsLabel } from '@/features/feed/components/comment-count';
import { PlantPhoto } from '@/features/plants/components/plant-photo';
import { logAction } from '@/lib/logger';
import type { PlantPost } from '@/lib/post/types';

/**
 * A shared plant or plant photo hanging off the vine: who and what, then the garden's plant card look.
 * Tapping it opens the post's own page. `hideAuthor` is for the user's own profile, where every post
 * is theirs: the label is just the kind.
 */
export function FeedPlantCard({ post, hideAuthor = false }: { post: PlantPost; hideAuthor?: boolean }) {
  const router = useRouter();
  // The feed only has the user and their friends; null friendship means it's the user's own.
  const isOwn = post.author.friendship === null;
  const who = isOwn ? 'You' : post.author.username;
  const kind = post.type === 'new_photo' ? 'new photo' : 'new plant';

  return (
    // Fills the slot it's given (the feed's 136px, a third of the profile), like a sticky note.
    // Shadow goes through style so it sets both iOS shadow* and Android elevation.
    <Pressable
      accessibilityRole="button"
      // The card is one element to a screen reader, so the comment and the count go in its label.
      accessibilityLabel={`${post.body ? `${post.plantName}: ${post.body}` : post.plantName}, ${commentsLabel(post.commentCount)}`}
      accessibilityHint="Opens the post"
      onPress={() => {
        logAction('post_opened', { context: { post_id: post.id, post_type: post.type } });
        router.push({ pathname: '/post/[id]', params: { id: post.id } });
      }}
      className="w-full rounded-2xl bg-background-element p-1.5 active:opacity-70"
      style={Shadow.card}>
      {/* Who and what, on the card itself like a label on a print. */}
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
      {/* A new photo's comment, written under the name like a note on a polaroid. */}
      {post.body && (
        <Text className="type-body-medium px-1 pb-1 text-text-secondary" numberOfLines={4}>
          {post.body}
        </Text>
      )}
      <View className="px-1 pb-1">
        <CommentCount count={post.commentCount} />
      </View>
    </Pressable>
  );
}
