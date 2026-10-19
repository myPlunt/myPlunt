import { useRef } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { DayMark } from '@/features/feed/components/day-mark';
import { FeedPlantCard } from '@/features/feed/components/feed-plant-card';
import { VineStem } from '@/features/feed/components/vine-stem';
import { groupByDay } from '@/features/feed/feed-days';
import { useFeed } from '@/features/feed/use-feed';
import { useTheme } from '@/hooks/use-theme';

export function FeedScreen() {
  const theme = useTheme();
  const { posts, error, isLoading, retry } = useFeed();
  const scrollRef = useRef<ScrollView>(null);
  const days = groupByDay(posts ?? [], new Date());
  // Counts posts across the days, so the cards keep alternating sides of the stem.
  let postIndex = 0;

  return (
    <View className="flex-1 bg-background">
      {/* No bottom edge: the tab bar below already pads for the home indicator. */}
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <AppHeader title="Growing together" />

        {/* No bottom padding: the stem runs to the edge, so it looks like it grows out from
            under the tab bar. The newest growth is at the bottom, so the feed opens there. */}
        <ScrollView
          ref={scrollRef}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          contentContainerClassName="w-full max-w-content grow self-center px-6">
          {isLoading ? (
            // A colour prop, so it reads the theme instead of a class.
            <ActivityIndicator accessibilityLabel="Loading feed" color={theme.primary} className="mt-6" />
          ) : error ? (
            <View className="mt-4 items-start gap-3">
              <Text className="type-body-medium text-error">{error}</Text>
              <Button label="Try again" variant="secondary" onPress={retry} />
            </View>
          ) : null}

          {/* The vine grows upwards: the stem fills the whole area behind the posts, which hang
              off both sides of it. Room at the top for its leaf, at the bottom for today's mark. */}
          <View className="grow pb-16 pt-12">
            <View className="absolute inset-0 items-center">
              <VineStem />
            </View>
            {days.map((day) => (
              <View key={day.label}>
                {day.posts.map((post, i) => {
                  const side = postIndex++ % 2 === 0 ? 'self-end' : 'self-start';
                  // Each card starts beside the one before it, so they zigzag up the stem.
                  return (
                    <View key={post.id} className={`${side} ${i > 0 ? '-mt-24' : ''}`}>
                      <FeedPlantCard post={post} />
                    </View>
                  );
                })}
                {!day.isToday && (
                  <View className="items-center py-4">
                    <DayMark label={day.label} />
                  </View>
                )}
              </View>
            ))}
            {/* Sits on the stem just above its base, where the stem is still centred. */}
            <View className="absolute bottom-6 self-center">
              <DayMark label="Today" />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
