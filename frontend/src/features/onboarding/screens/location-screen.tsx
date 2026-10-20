import { useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { describeError } from '@/lib/auth/api-client';
import { logFailedUi } from '@/lib/logger';
import { useTourBack } from '@/features/onboarding/use-tour-back';
import { useTourBackLock } from '@/features/onboarding/use-tour-back-lock';
import { ONBOARDING_STEPS, useOnboardingStore } from '@/stores/onboarding-store';

import { shareLocation } from '../location-service';

const STEP_INDEX = ONBOARDING_STEPS.indexOf('location');

const REASONS: { icon: SymbolViewProps['name']; title: string; body: string }[] = [
  {
    icon: { ios: 'snowflake', android: 'ac_unit', web: 'ac_unit' },
    title: 'Frost and heat alerts',
    body: 'Know when to bring plants in or water extra.',
  },
  {
    icon: { ios: 'cloud.sun.fill', android: 'partly_cloudy_day', web: 'partly_cloudy_day' },
    title: 'An app that matches your sky',
    body: "myPlunt's look follows the weather outside.",
  },
];

// Tour step 3: a full page rather than a card, because it ends in the system's permission prompt.
// It replaced Edit profile, so leaving it goes back to the profile, where the friends step starts.
export function LocationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { next, finish } = useOnboardingStore();
  useTourBackLock(true);
  const goBack = useTourBack();
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function leave(action: () => void) {
    action();
    router.back();
  }

  async function handleShare() {
    setError(null);
    setIsSharing(true);
    try {
      // Denied permission saves nothing; the tour moves on either way.
      await shareLocation();
      leave(next);
    } catch (err) {
      logFailedUi('location_share_failed_ui', err);
      setError(describeError(err));
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView contentContainerClassName="w-full max-w-content grow gap-6 self-center px-6 pb-6 pt-4">
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="type-label uppercase text-text-secondary">
                Step {STEP_INDEX + 1} of {ONBOARDING_STEPS.length} · Your city
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Skip tour"
                onPress={() => leave(finish)}
                hitSlop={12}
                className="active:opacity-70">
                <Text className="type-body-medium text-text-secondary">Skip tour</Text>
              </Pressable>
            </View>
            <View className="flex-row gap-1">
              {ONBOARDING_STEPS.map((name, i) => (
                <View key={name} className={`h-1 flex-1 rounded-full bg-action-primary ${i > STEP_INDEX ? 'opacity-25' : ''}`} />
              ))}
            </View>
          </View>

          <View className="items-center self-center">
            {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
            <SymbolView
              name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
              tintColor={theme.actionPrimary}
              size={72}
            />
          </View>

          <View className="gap-3">
            <Text className="type-h2 text-center text-action-primary">Where do your plants live?</Text>
            <Text className="type-body-large text-center text-text-secondary">
              Share your city once and we&apos;ll keep an eye on the weather for you.
            </Text>
          </View>

          <View className="gap-4">
            {REASONS.map((reason) => (
              <View key={reason.title} className="flex-row items-start gap-4">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-background-element">
                  <SymbolView name={reason.icon} tintColor={theme.primary} size={18} />
                </View>
                <View className="flex-1">
                  <Text className="type-subtitle-small text-text">{reason.title}</Text>
                  <Text className="type-body-medium text-text-secondary">{reason.body}</Text>
                </View>
              </View>
            ))}
          </View>

          <View className="mt-auto gap-2">
            <View className="flex-row items-center justify-center gap-2">
              <SymbolView name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }} tintColor={theme.textSecondary} size={14} />
              <Text className="type-caption text-text-secondary">We save your city, never your exact location.</Text>
            </View>
            {error && <Text className="type-body-medium text-center text-error">{error}</Text>}
            <Button label="Share my city" size="large" loading={isSharing} onPress={handleShare} />
            <Button label="Not now" variant="ghost" size="large" disabled={isSharing} onPress={() => leave(next)} />
            {goBack && <Button label="Back" variant="ghost" size="large" disabled={isSharing} onPress={goBack} />}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
