import { Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { PlantPhoto } from '@/features/plants/components/plant-photo';
import type { Post } from '@/lib/post/types';

/** A shared new plant hanging off the vine: who added it, then the garden's plant card look. */
export function FeedPlantCard({ post }: { post: Post }) {
  // The feed only has the user and their friends; null friendship means it's the user's own.
  const who = post.author.friendship === null ? 'You' : post.author.username;

  return (
    <View className="w-[148px] gap-1">
      <Text className="type-label uppercase text-accent" numberOfLines={1}>
        {who} · new plant
      </Text>
      {/* Shadow goes through style so it sets both iOS shadow* and Android elevation. */}
      <View className="rounded-3xl bg-background-element p-2" style={Shadow.card}>
        <PlantPhoto
          photoUrl={post.photoUrl}
          accessibilityLabel={`Photo of ${post.plantName}`}
          className="aspect-square w-full rounded-2xl"
          iconSize={32}
        />
        <Text className="type-subtitle-large px-2 pb-1 pt-2 text-text" numberOfLines={1}>
          {post.plantName}
        </Text>
      </View>
    </View>
  );
}
