import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';

export function FeedScreen() {
  return (
    <View className="flex-1 bg-background">
      {/* No bottom edge: the tab bar below already pads for the home indicator. */}
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <AppHeader />

        <ScrollView contentContainerClassName="w-full max-w-content grow self-center px-6 py-4">
          <View className="items-center gap-2 rounded-2xl bg-background-element p-6">
            <Text className="type-subtitle-large text-text">Your feed is empty</Text>
            <Text className="type-body-medium text-text-secondary">
              Posts from your plants and the people you follow will show up here.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
