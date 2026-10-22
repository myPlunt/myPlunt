import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
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
  const { posts, error, isLoading, isRefreshing, refresh, retry } = useFeed(getFeed);
  const days = groupByAge(posts ?? [], new Date());
  // Across the days, in the order they're shown, so the in-a-row limit spans day marks.
  const postIds = days.flatMap((day) => day.posts.map((post) => post.id));
  const sideList = feedSides(postIds);
  const sides = new Map(postIds.map((id, i) => [id, sideList[i]]));
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="I have a question"
              onPress={() => router.push('/ask')}
              className="h-10 -rotate-2 justify-center rounded-sm bg-note-yellow px-3 active:opacity-70"
              style={Shadow.card}>
              <View className="absolute -top-2 h-4 w-10 self-center bg-background-element opacity-70" />
              <Text className="type-button-medium text-text">I have a question</Text>
            </Pressable>
          }
        />

        {/* No bottom padding: the stem runs to the edge, as if it grows from under the tab bar. */}
        <ScrollView
          contentContainerClassName="w-full max-w-content grow self-center px-6"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
              progressBackgroundColor={theme.backgroundElement}
            />
          }>
          {isLoading ? (
            <ActivityIndicator accessibilityLabel="Loading feed" color={theme.primary} className="mt-6" />
          ) : error ? (
            <View className="mt-4 items-start gap-3">
              <Text className="type-body-medium text-error">{error}</Text>
              <Button label="Try again" variant="secondary" onPress={retry} />
            </View>
          ) : null}

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

const ROW_GAP = 16;

interface FeedRowsProps {
  posts: Post[];
  sides: Map<string, Side>;
  heights: Map<string, number>;
  onMeasure: (id: string, height: number) => void;
}

function FeedRows({ posts, sides, heights, onMeasure }: FeedRowsProps) {
  const rows = posts.map((post) => ({ id: post.id, side: sides.get(post.id) ?? 'left' }));
  const { marginTops, paddingBottom } = rowOffsets(rows, heights, ROW_GAP);

  return (
    <View style={{ paddingBottom }}>
      {posts.map((post, i) => (
        <View
          key={post.id}
          onLayout={(e) => onMeasure(post.id, e.nativeEvent.layout.height)}
          className={`w-[136px] items-center ${rows[i].side === 'right' ? 'self-end' : 'self-start'}`}
          style={{ marginTop: marginTops[i] }}>
          {post.type === 'question' ? <StickyNote post={post} /> : <FeedPlantCard post={post} />}
        </View>
      ))}
    </View>
  );
}
