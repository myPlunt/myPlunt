import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Shadow } from '@/constants/theme';
import { DayMark } from '@/features/feed/components/day-mark';
import { FeedPlantCard } from '@/features/feed/components/feed-plant-card';
import { StickyNote } from '@/features/feed/components/sticky-note';
import { VineStem } from '@/features/feed/components/vine-stem';
import { groupByAge } from '@/features/feed/feed-days';
import { rowOffsets } from '@/features/feed/feed-rows';
import { getFeed } from '@/features/feed/feed-service';
import { feedSides, type Side } from '@/features/feed/feed-sides';
import { useFeed } from '@/features/feed/use-feed';
import { useTheme } from '@/hooks/use-theme';
import type { Post } from '@/lib/post/types';

export function FeedScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { posts, error, isLoading, retry } = useFeed(getFeed);
  const days = groupByAge(posts ?? [], new Date());
  // Across the days, in the order they're shown, so the in-a-row limit spans day marks.
  const postIds = days.flatMap((day) => day.posts.map((post) => post.id));
  const sideList = feedSides(postIds);
  const sides = new Map(postIds.map((id, i) => [id, sideList[i]]));
  // Each post's measured height, so a post on the other side can start halfway down the one before.
  const [heights, setHeights] = useState(new Map<string, number>());

  function measure(id: string, height: number) {
    setHeights((current) => (current.get(id) === height ? current : new Map(current).set(id, height)));
  }

  return (
    <View className="flex-1 bg-background">
      {/* No bottom edge: the tab bar below already pads for the home indicator. */}
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <AppHeader
          right={
            // Same height as the logo, styled as a small Post-it like the questions it makes.
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="I have a question"
              onPress={() => router.push('/ask')}
              className="h-10 -rotate-2 justify-center rounded-sm bg-note-yellow px-3 active:opacity-70"
              // Shadow goes through style so it sets both iOS shadow* and Android elevation.
              style={Shadow.card}>
              <Text className="type-button-medium text-text">I have a question</Text>
            </Pressable>
          }
        />

        {/* No bottom padding: the stem runs to the edge, so it looks like it grows out from
            under the tab bar. The newest growth is at the top, under today's mark. */}
        <ScrollView contentContainerClassName="w-full max-w-content grow self-center px-6">
          {isLoading ? (
            // A colour prop, so it reads the theme instead of a class.
            <ActivityIndicator accessibilityLabel="Loading feed" color={theme.primary} className="mt-6" />
          ) : error ? (
            <View className="mt-4 items-start gap-3">
              <Text className="type-body-medium text-error">{error}</Text>
              <Button label="Try again" variant="secondary" onPress={retry} />
            </View>
          ) : null}

          {/* The stem fills the whole area behind the posts, which hang off both sides of it,
              newest first: each group's mark (Today, Yesterday, This week, 2 weeks ago...)
              sits on the stem above its posts. Room at the top for the stem's leaf. */}
          <View className="grow pb-10 pt-8">
            <View className="absolute inset-0 items-center">
              <VineStem />
            </View>
            {days.map((day) => (
              <View key={day.label}>
                <View className="items-center py-4">
                  <DayMark label={day.label} />
                </View>
                <FeedRows posts={day.posts} sides={sides} heights={heights} onMeasure={measure} />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Space between posts on the same side, and the smallest gap to the last post on a post's side.
const ROW_GAP = 16;

interface FeedRowsProps {
  posts: Post[];
  sides: Map<string, Side>;
  heights: Map<string, number>;
  onMeasure: (id: string, height: number) => void;
}

/**
 * One post per row, on its side of the stem. A post on the other side from the one before
 * starts halfway down it (feed-rows.ts), so the vine zigzags without posts overlapping.
 */
function FeedRows({ posts, sides, heights, onMeasure }: FeedRowsProps) {
  const rows = posts.map((post) => ({ id: post.id, side: sides.get(post.id) ?? 'left' }));
  const { marginTops, paddingBottom } = rowOffsets(rows, heights, ROW_GAP);

  // The offsets come from measured heights, so they go through style.
  return (
    <View style={{ paddingBottom }}>
      {posts.map((post, i) => (
        <View
          key={post.id}
          onLayout={(e) => onMeasure(post.id, e.nativeEvent.layout.height)}
          // Every post sits in a slot as wide as a sticky note (w-[136px]), centred, so the
          // narrower plant cards line up with the middle of the notes instead of their edge.
          className={`w-[136px] items-center ${rows[i].side === 'right' ? 'self-end' : 'self-start'}`}
          style={{ marginTop: marginTops[i] }}>
          {post.type === 'question' ? <StickyNote post={post} /> : <FeedPlantCard post={post} />}
        </View>
      ))}
    </View>
  );
}
