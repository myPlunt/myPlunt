import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { EditProfileForm } from '@/features/profile/components/edit-profile-form';
import { useProfile } from '@/features/profile/use-profile';
import { Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function EditProfileScreen() {
  const theme = useTheme();
  const { user, error, isLoading, retry } = useProfile();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader title="Edit profile" showBack />

        <ScrollView
          contentContainerClassName="w-full max-w-content grow gap-6 self-center p-6"
          keyboardShouldPersistTaps="handled">
          <View className="gap-3 rounded-2xl bg-background-element p-4" style={Shadow.card}>
            <Text className="type-label text-accent">PROFILE</Text>
            {/* Needs file storage on the backend before it can be built. */}
            <View className="flex-row items-center justify-between">
              <Text className="type-body-large text-text-secondary">Profile picture</Text>
              <Text className="type-caption text-text-secondary">Coming soon</Text>
            </View>
            {isLoading ? (
              // A colour prop, so it reads the theme instead of a class.
              <ActivityIndicator accessibilityLabel="Loading profile" color={theme.primary} />
            ) : error ? (
              <View className="items-start gap-3">
                <Text className="type-body-medium text-error">{error}</Text>
                <Button label="Try again" variant="secondary" onPress={retry} />
              </View>
            ) : (
              user && <EditProfileForm key={user.id} user={user} />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
