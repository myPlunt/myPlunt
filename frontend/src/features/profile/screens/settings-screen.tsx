import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { LinkCard } from '@/components/ui/link-card';
import { useAuthActions } from '@/features/auth/use-auth-actions';
import { ChangeEmailForm } from '@/features/profile/components/change-email-form';
import { useProfile } from '@/features/profile/use-profile';
import { Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOnboardingStore } from '@/stores/onboarding-store';

// Account settings. Profile details (username, bio, picture) live on Edit profile.
export function SettingsScreen() {
  const theme = useTheme();
  const { logout } = useAuthActions();
  const { user, error, isLoading, retry } = useProfile();
  const onboarding = useOnboardingStore();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader showBack />

        <ScrollView
          contentContainerClassName="w-full max-w-content grow gap-6 self-center p-6"
          keyboardShouldPersistTaps="handled">
          <View className="gap-3 rounded-2xl bg-background-element p-4" style={Shadow.card}>
            <Text className="type-label text-accent">ACCOUNT</Text>
            {isLoading ? (
              // Colour props (spinner, icons) read the theme instead of a class.
              <ActivityIndicator accessibilityLabel="Loading account" color={theme.primary} />
            ) : error ? (
              <View className="items-start gap-3">
                <Text className="type-body-medium text-error">{error}</Text>
                <Button label="Try again" variant="secondary" onPress={retry} />
              </View>
            ) : (
              user && <ChangeEmailForm key={user.id} user={user} />
            )}
            {/* Changing the password is a separate task. */}
            <View className="flex-row items-center justify-between">
              <Text className="type-body-large text-text-secondary">Change password</Text>
              <Text className="type-caption text-text-secondary">Coming soon</Text>
            </View>
          </View>

          {/* The tabs layout opens the welcome page as soon as the tour starts. */}
          <LinkCard
            title="Take the tour again"
            icon={{ ios: 'map', android: 'tour', web: 'tour' }}
            onPress={onboarding.start}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log out"
            onPress={logout}
            className="flex-row items-center gap-3 self-start py-2 active:opacity-60">
            <SymbolView
              name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }}
              tintColor={theme.error}
              size={22}
            />
            <Text className="type-subtitle-small text-error">Log out</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
