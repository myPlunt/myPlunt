import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { UserAvatar } from '@/components/user/user-avatar';

export function FeedScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <AppHeader
          title="Feed"
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              onPress={() => router.push('/profile')}
              className="active:opacity-70">
              <UserAvatar />
            </Pressable>
          }
        />

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
