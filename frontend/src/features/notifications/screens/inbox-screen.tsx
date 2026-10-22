import { useRouter, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user/user-avatar';
import { Shadow } from '@/constants/theme';
import { ageLabel } from '@/features/feed/feed-days';
import { useInbox } from '@/features/notifications/use-inbox';
import { useTheme } from '@/hooks/use-theme';

export function InboxScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { notifications, error, isLoading, isRefreshing, refresh, retry } = useInbox();
  const now = new Date();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader showBack />
        <ScrollView
          contentContainerClassName="w-full max-w-content grow gap-3 self-center p-6"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
              progressBackgroundColor={theme.backgroundElement}
            />
          }>
          <Text accessibilityRole="header" className="type-h3 text-text">
            Notifications
          </Text>
          {isLoading ? (
            <ActivityIndicator accessibilityLabel="Loading notifications" color={theme.primary} className="mt-6" />
          ) : error ? (
            <View className="items-start gap-3">
              <Text className="type-body-medium text-error">{error}</Text>
              <Button label="Try again" variant="secondary" onPress={retry} />
            </View>
          ) : notifications?.length ? (
            notifications.map((notification) => (
              <Pressable
                key={notification.id}
                accessibilityRole="button"
                accessibilityLabel={`${notification.title} ${notification.body}`}
                onPress={() => router.push(notification.url as Href)}
                className="flex-row items-center gap-3 rounded-2xl border-[1.5px] border-input-border bg-background-element px-4 py-3 active:opacity-70"
                style={Shadow.card}>
                {notification.fromUserId && <UserAvatar size={40} url={notification.fromAvatarUrl} />}
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="type-subtitle-small flex-1 text-text">{notification.title}</Text>
                    <Text className="type-caption text-text-secondary">
                      {ageLabel(new Date(notification.createdAt), now)}
                    </Text>
                  </View>
                  <Text className="type-body-medium text-text-secondary">{notification.body}</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Text className="type-body-medium text-text-secondary">No notifications yet.</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
