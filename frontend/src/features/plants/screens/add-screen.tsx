import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';

// Placeholder for the add flow: choosing between a plant and a planter, then
// their forms, comes next (waiting on the plant/planter endpoints).
export function AddScreen() {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader title="Add" showBack />

        <ScrollView contentContainerClassName="w-full max-w-content grow self-center px-6 py-4">
          <View className="items-center gap-2 rounded-2xl bg-background-element p-6">
            <Text className="type-subtitle-large text-text">Add a plant or planter</Text>
            <Text className="type-body-medium text-center text-text-secondary">
              Adding plants and planters to your garden is coming soon.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
