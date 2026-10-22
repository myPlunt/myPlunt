import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { useFeedActions } from '@/features/feed/use-feed-actions';
import { useTheme } from '@/hooks/use-theme';
import { logFailedUi } from '@/lib/logger';
import type { Post } from '@/lib/post/types';

/**
 * The user's drop on a post (the app's like) and the post's count, shown straight away and put back
 * if it didn't go through. Shared by the drop button and the post page's double-tap on the photo.
 */
export function useWaterDrop(post: Post) {
  const { waterPost, unwaterPost } = useFeedActions();
  const [state, setState] = useState({ post, watered: post.wateredByMe, count: post.waterCount });
  const [isBusy, setIsBusy] = useState(false);
  // A reload brings a new post with fresh numbers; start over from those.
  if (state.post !== post) {
    setState({ post, watered: post.wateredByMe, count: post.waterCount });
  }

  async function setWatered(next: boolean) {
    if (isBusy || next === state.watered) return;
    const change = next ? 1 : -1;
    setState((current) => ({ ...current, watered: next, count: current.count + change }));
    setIsBusy(true);
    try {
      await (next ? waterPost(post.id) : unwaterPost(post.id));
    } catch (err) {
      logFailedUi('post_water_failed_ui', err, { post_id: post.id });
      setState((current) => ({ ...current, watered: !next, count: current.count - change }));
    } finally {
      setIsBusy(false);
    }
  }

  return {
    watered: state.watered,
    count: state.count,
    isBusy,
    // Null friendship means it's the user's own post, which they can't water.
    canWater: post.author.friendship !== null,
    toggle: () => setWatered(!state.watered),
    // A double-tap only ever waters; taking the drop back is the pill's job.
    water: () => setWatered(true),
  };
}

export type WaterDropState = ReturnType<typeof useWaterDrop>;

/** The drop on a feed card, with its own state. */
export function WaterDrop({ post }: { post: Post }) {
  return <WaterDropView drop={useWaterDrop(post)} />;
}

/**
 * A drop of water and the post's count. On a friend's post it's a button that gives or takes back
 * the user's drop; on the user's own post it only shows the count. `pill` is the bigger version on
 * the post's own page, laid over its photo; the feed cards use the plain one.
 */
export function WaterDropView({ drop, pill = false }: { drop: WaterDropState; pill?: boolean }) {
  const theme = useTheme();
  // On a photo the pill needs its own background to stay readable; the shadow token sets both iOS
  // shadow* and Android elevation.
  const container = `flex-row items-center gap-1 ${pill ? 'rounded-full bg-background-element px-3 py-1.5' : ''}`;
  const containerStyle = pill ? Shadow.level2 : undefined;

  const content = (
    <>
      {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
      <SymbolView
        name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
        tintColor={theme.water}
        size={pill ? 18 : 14}
      />
      <Text className={pill ? 'type-body-medium text-text' : 'type-caption text-text-secondary'}>{drop.count}</Text>
    </>
  );

  if (!drop.canWater) {
    return (
      <View accessible accessibilityLabel={dropsLabel(drop.count)} className={container} style={containerStyle}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={drop.watered ? 'Take your water back' : 'Water this post'}
      accessibilityValue={{ text: dropsLabel(drop.count) }}
      accessibilityState={{ selected: drop.watered }}
      disabled={drop.isBusy}
      onPress={drop.toggle}
      hitSlop={8}
      className={`${container} active:opacity-70`}
      style={containerStyle}>
      {content}
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
