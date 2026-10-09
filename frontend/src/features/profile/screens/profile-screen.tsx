import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user/user-avatar';
import { useAuthActions } from '@/features/auth/use-auth-actions';
import { useProfile } from '@/features/profile/use-profile';
import { useTheme } from '@/hooks/use-theme';

export function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { logout } = useAuthActions();
  const { user, error, isLoading, retry } = useProfile();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader onBrandPress={() => router.dismissTo('/')} />

        <ScrollView contentContainerClassName="w-full max-w-content grow gap-6 self-center p-6">
          <View className="items-center gap-1">
            <UserAvatar size={96} />
            {isLoading ? (
              // A colour prop, so it reads the theme instead of a class.
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
                </>
              )
            )}
          </View>

          <View className="gap-2 rounded-2xl bg-background-element p-4">
            <Text className="type-label text-accent">ACCOUNT</Text>
            <Text className="type-body-large text-text-secondary">Profile and settings options will appear here.</Text>
          </View>

          <Button label="Log out" variant="secondary" size="large" onPress={logout} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
