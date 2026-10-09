import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user/user-avatar';
import { useProfile } from '@/features/profile/use-profile';
import { useTheme } from '@/hooks/use-theme';

export function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, error, isLoading, retry } = useProfile();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader
          title="Profile"
          showBack
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              onPress={() => router.push('/settings')}
              className="h-10 w-10 items-center justify-center active:opacity-70">
              {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
              <SymbolView
                name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
                tintColor={theme.actionPrimary}
                size={22}
              />
            </Pressable>
          }
        />

        <ScrollView contentContainerClassName="w-full max-w-content grow gap-6 self-center p-6">
          <View className="items-center gap-1">
            <UserAvatar size={96} />
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
                  <View className="mt-4">
                    <Button label="Edit profile" variant="subtle" onPress={() => router.push('/edit-profile')} />
                  </View>
                </>
              )
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
