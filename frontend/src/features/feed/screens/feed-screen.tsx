import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { DayMark } from '@/features/feed/components/day-mark';
import { VineStem } from '@/features/feed/components/vine-stem';

export function FeedScreen() {
  return (
    <View className="flex-1 bg-background">
      {/* No bottom edge: the tab bar below already pads for the home indicator. */}
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <AppHeader />

        {/* No bottom padding: the stem runs to the edge, so it looks like it grows out from
            under the tab bar. */}
        <ScrollView contentContainerClassName="w-full max-w-content grow self-center px-6">
          <Text className="type-h3 text-text">Growing together</Text>

          {/* The vine grows upwards: the stem fills the space above today's mark, and
              friends' posts will hang off both sides of it. */}
          <View className="grow items-center pt-4">
            <VineStem />
            {/* Sits on the stem just above its base, where the stem is still centred. */}
            <View className="absolute bottom-6">
              <DayMark label="Today" />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
