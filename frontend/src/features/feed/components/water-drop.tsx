import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { useFeedActions } from '@/features/feed/use-feed-actions';
import { useTheme } from '@/hooks/use-theme';
import { logFailedUi } from '@/lib/logger';
import type { Post } from '@/lib/post/types';

/**
 * The app's like: a drop of water and how many a post got. On a friend's post it's a button that
 * gives or takes back the user's drop; on the user's own post it only shows the count. `pill` is the
 * bigger version on the post's own page, laid over its photo; the feed cards use the plain one.
 */
export function WaterDrop({ post, pill = false }: { post: Post; pill?: boolean }) {
  // Starts over from the post when a reload brings new numbers.
  return <WaterDropToggle key={`${post.id}:${post.waterCount}:${post.wateredByMe}`} post={post} pill={pill} />;
}

function WaterDropToggle({ post, pill }: { post: Post; pill: boolean }) {
  const theme = useTheme();
  const { waterPost, unwaterPost } = useFeedActions();
  const [watered, setWatered] = useState(post.wateredByMe);
  const [count, setCount] = useState(post.waterCount);
  const [isBusy, setIsBusy] = useState(false);
  // Null friendship means it's the user's own post, which they can't water.
  const canWater = post.author.friendship !== null;

  // On a photo the pill needs its own background to stay readable; the shadow token sets both iOS
  // shadow* and Android elevation.
  const container = `flex-row items-center gap-1 ${pill ? 'rounded-full bg-background-element px-3 py-1.5' : ''}`;
  const containerStyle = pill ? Shadow.level2 : undefined;

  const drop = (
    <>
      {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
      <SymbolView
        name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
        tintColor={theme.water}
        size={pill ? 18 : 14}
      />
      <Text className={pill ? 'type-body-medium text-text' : 'type-caption text-text-secondary'}>{count}</Text>
    </>
  );

  if (!canWater) {
    return (
      <View accessible accessibilityLabel={dropsLabel(count)} className={container} style={containerStyle}>
        {drop}
      </View>
    );
  }

  async function toggle() {
    const next = !watered;
    // Shown straight away, and put back if it didn't go through.
    setWatered(next);
    setCount((current) => current + (next ? 1 : -1));
    setIsBusy(true);
    try {
      await (next ? waterPost(post.id) : unwaterPost(post.id));
    } catch (err) {
      logFailedUi('post_water_failed_ui', err, { post_id: post.id });
      setWatered(!next);
      setCount((current) => current - (next ? 1 : -1));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={watered ? 'Take your water back' : 'Water this post'}
      accessibilityValue={{ text: dropsLabel(count) }}
      accessibilityState={{ selected: watered }}
      disabled={isBusy}
      onPress={toggle}
      hitSlop={8}
      className={`${container} active:opacity-70`}
      style={containerStyle}>
      {drop}
    </Pressable>
  );
}

function dropsLabel(count: number) {
  return count === 1 ? '1 drop' : `${count} drops`;
}

/** A post card's spoken counts, so they aren't lost when the card is read as one element. */
export function countsLabel(post: Post) {
  return `${post.commentCount === 1 ? '1 comment' : `${post.commentCount} comments`}, ${dropsLabel(post.waterCount)}`;
}
