import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useOnboardingActions } from '@/features/onboarding/use-onboarding-actions';
import { useTourBackLock } from '@/features/onboarding/use-tour-back-lock';
import { useOnboardingStore } from '@/stores/onboarding-store';

const TOUR_PARTS = [
  'Your profile and city',
  'Find your friends',
  'Your first plant: add, photograph, water',
  'Explore the PluntDex',
];

export function WelcomeScreen() {
  const router = useRouter();
  const { next } = useOnboardingStore();
  const { endTour } = useOnboardingActions();
  useTourBackLock(true);

  function leave(action: () => void, to: '/profile' | '/') {
    action();
    router.replace(to);
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView contentContainerClassName="w-full max-w-content grow gap-6 self-center px-6 pb-6 pt-12">
          <Image className="h-40 w-36 self-center" source={require('@/assets/images/Logo.png')} contentFit="contain" />

          <View className="gap-3">
            {/* 58 is as tight as Lateef goes before its capitals clip. A style, as type-h1 beats a leading-* class. */}
            <Text className="type-h1 text-center text-action-primary" style={{ lineHeight: 58 }}>
              Welcome to myPlunt
            </Text>
            <Text className="type-body-large text-center text-text-secondary">
              Let&apos;s set up your profile and plant your first plant. It takes about two minutes.
            </Text>
          </View>

          <View className="gap-3 rounded-2xl bg-background-element p-4">
            {TOUR_PARTS.map((part, i) => (
              <View key={part} className="flex-row items-center gap-3">
                <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
                  <Text className="type-label text-background-element">{i + 1}</Text>
                </View>
                <Text className="type-body-large flex-1 text-text">{part}</Text>
              </View>
            ))}
          </View>

          <View className="mt-auto gap-2">
            <Button label="Show me around" size="large" onPress={() => leave(next, '/profile')} />
            <Button label="Skip the tour" variant="ghost" size="large" onPress={() => leave(() => endTour(true), '/')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
