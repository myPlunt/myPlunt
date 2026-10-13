import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { LinkCard } from '@/components/ui/link-card';
import { UserAvatar } from '@/components/user/user-avatar';
import { WateringStreakBadge } from '@/features/profile/components/watering-streak';
import { useProfile } from '@/features/profile/use-profile';
import { useWateringStreak } from '@/features/profile/use-watering-streak';
import { useTheme } from '@/hooks/use-theme';

export function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, error, isLoading, retry } = useProfile();
  const streak = useWateringStreak();

  return (
    <View className="flex-1 bg-background">
      {/* No bottom edge: the tab bar below already pads for the home indicator. */}
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <AppHeader
          right={
            <View className="flex-row">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open friends"
                onPress={() => router.push('/friends')}
                className="h-10 w-10 items-center justify-center active:opacity-70">
                {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
                <SymbolView
                  name={{ ios: 'person.2.fill', android: 'group', web: 'group' }}
                  tintColor={theme.actionPrimary}
                  size={22}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open settings"
                onPress={() => router.push('/settings')}
                className="h-10 w-10 items-center justify-center active:opacity-70">
                <SymbolView
                  name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
                  tintColor={theme.actionPrimary}
                  size={22}
                />
              </Pressable>
            </View>
          }
        />

        <ScrollView contentContainerClassName="w-full max-w-content grow gap-6 self-center p-6">
          <View className="items-center gap-1">
            <View>
              <UserAvatar size={96} />
              {streak !== null && (
                <View className="absolute -bottom-1 -right-1">
                  <WateringStreakBadge streak={streak} />
                </View>
              )}
            </View>
            {isLoading ? (
              <ActivityIndicator accessibilityLabel="Loading profile" color={theme.primary} className="mt-4" />
            ) : error ? (
              <View className="items-center gap-3">
                <Text className="type-body-medium text-error">{error}</Text>
                <Button label="Try again" variant="secondary" onPress={retry} />
              </View>
            ) : (
              user && (
                <>
                  <Text className="type-h4 text-text">{user.username}</Text>
                  <Text className="type-body-medium text-text-secondary">{user.email}</Text>
                  {user.bio && <Text className="type-body-large mt-3 text-center text-text">{user.bio}</Text>}
                  <View className="mt-4 flex-row gap-3">
                    <Button label="My garden" onPress={() => router.push('/garden')} />
                    <Button label="Edit profile" variant="subtle" onPress={() => router.push('/edit-profile')} />
                  </View>
                </>
              )
            )}
          </View>
          {user && (
            <LinkCard
              title="Watering calendar"
              icon={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
              onPress={() => router.push('/watering-calendar')}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
