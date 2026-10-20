import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/stores/onboarding-store';

const TOUR_PARTS = [
  'Your profile and city',
  'Find your friends',
  'Your first plant: add, photograph, water',
  'Explore the PluntDex',
];

// Page 0 of the tour, shown right after registering. Leaving goes back to the tabs, where
// the tabs layout opens the first step's screen.
export function WelcomeScreen() {
  const router = useRouter();
  const { next, finish } = useOnboardingStore();

  function leave(action: () => void) {
    action();
    router.back();
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView contentContainerClassName="w-full max-w-content grow gap-6 self-center px-6 pb-6 pt-12">
          <Image className="h-40 w-36 self-center" source={require('@/assets/images/Logo.png')} contentFit="contain" />

          <View className="gap-3">
            {/* The title wraps onto two lines; h1's 64px line height spaces them too far apart.
                Lateef's tall capitals get clipped at the top below ~58px, so this is as tight
                as it goes. style, because type-h1 would win over a leading-* class. */}
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
            <Button label="Show me around" size="large" onPress={() => leave(next)} />
            <Button label="Skip the tour" variant="ghost" size="large" onPress={() => leave(finish)} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
