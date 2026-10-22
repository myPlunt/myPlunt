import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { OnboardingCard } from '@/features/onboarding/components/onboarding-card';
import { useTourBackLock } from '@/features/onboarding/use-tour-back-lock';
import { AvatarField } from '@/features/profile/components/avatar-field';
import { EditProfileForm } from '@/features/profile/components/edit-profile-form';
import { useProfile } from '@/features/profile/use-profile';
import { Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOnboardingStore, type TourStep } from '@/stores/onboarding-store';

export function EditProfileScreen() {
  const theme = useTheme();
  const { user, error, isLoading, retry } = useProfile();
  const router = useRouter();
  const { step, next } = useOnboardingStore();

  const isAvatarStep = step === 'avatar' && !!user;
  // Leaving would strand the picture step's card; "Not now" and saving a picture are the ways on.
  useTourBackLock(isAvatarStep);

  function completeTourStep(saved: TourStep) {
    if (step !== saved) return;
    next();
    if (saved === 'avatar') router.replace('/location');
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <Stack.Screen options={{ gestureEnabled: !isAvatarStep }} />
        <AppHeader showBack={!isAvatarStep} />

        {/* Inside this view, not the SafeAreaView: an absolute child ignores its parent's padding. */}
        <View className="flex-1">
          <ScrollView
            // Room to scroll the form out from under the tour card.
            contentContainerClassName={`w-full max-w-content grow gap-6 self-center p-6 ${isAvatarStep ? 'pb-72' : ''}`}
            keyboardShouldPersistTaps="handled">
            <View className="gap-3 rounded-2xl bg-background-element p-4" style={Shadow.card}>
              <Text className="type-label text-accent">PROFILE</Text>
              {isLoading ? (
                <ActivityIndicator accessibilityLabel="Loading profile" color={theme.primary} />
              ) : error ? (
                <View className="items-start gap-3">
                  <Text className="type-body-medium text-error">{error}</Text>
                  <Button label="Try again" variant="secondary" onPress={retry} />
                </View>
              ) : (
                user && (
                  <>
                    <AvatarField
                      key={`avatar-${user.id}`}
                      user={user}
                      highlighted={isAvatarStep}
                      onSaved={() => completeTourStep('avatar')}
                    />
                    <EditProfileForm key={user.id} user={user} onSaved={() => completeTourStep('bio')} />
                  </>
                )
              )}
            </View>
          </ScrollView>

          {isAvatarStep && (
            <View className="absolute inset-x-3 bottom-3">
              <OnboardingCard
                step="avatar"
                title="Add a profile picture?"
                body="Tap your picture to add a photo of you, or of your favourite plant."
                onSkip={() => router.replace('/location')}
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
