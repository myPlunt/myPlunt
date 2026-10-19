import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { PlantPhoto } from '@/features/plants/components/plant-photo';
import { logAction } from '@/lib/logger';
import type { PlantPost } from '@/lib/post/types';

/** A shared plant or plant photo hanging off the vine: who and what, then the garden's plant card look. */
export function FeedPlantCard({ post }: { post: PlantPost }) {
  const router = useRouter();
  // The feed only has the user and their friends; null friendship means it's the user's own.
  const isOwn = post.author.friendship === null;
  const who = isOwn ? 'You' : post.author.username;

  return (
    // Fills the slot it's given (the feed's 136px, a third of the profile), like a sticky note.
    <View className="w-full gap-1">
      <Text className="type-label uppercase text-accent" numberOfLines={1}>
        {who} · {post.type === 'new_photo' ? 'new photo' : 'new plant'}
      </Text>
      {/* Only the user's own plants open: a plant page is owner-only until friends can view
          one (GET /v1/plants/{id} answers 404 to anyone else). Shadow goes through style so
          it sets both iOS shadow* and Android elevation. */}
      <Pressable
        disabled={!isOwn}
        accessibilityRole={isOwn ? 'button' : undefined}
        // The card is one element to a screen reader, so the comment goes in its label.
        accessibilityLabel={post.body ? `${post.plantName}: ${post.body}` : post.plantName}
        accessibilityHint={isOwn ? "Shows this plant's details" : undefined}
        onPress={() => {
          logAction('feed_plant_opened', { context: { post_id: post.id, plant_id: post.plantId } });
          router.push({ pathname: '/plant/[id]', params: { id: post.plantId } });
        }}
        className="rounded-2xl bg-background-element p-1.5 active:opacity-70"
        style={Shadow.card}>
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
      </Pressable>
    </View>
  );
}
