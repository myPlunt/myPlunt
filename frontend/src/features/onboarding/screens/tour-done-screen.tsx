import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useTourBack } from '@/features/onboarding/use-tour-back';
import { useTourBackLock } from '@/features/onboarding/use-tour-back-lock';
import { useOnboardingStore } from '@/stores/onboarding-store';

// The tour's last page, shown in place of the tabs after its last step (a skipped tour ends
// without it). Its button ends the tour and brings the tabs back on the feed.
export function TourDoneScreen() {
  const router = useRouter();
  const { finish } = useOnboardingStore();
  useTourBackLock(true);
  const goBack = useTourBack();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView contentContainerClassName="w-full max-w-content grow gap-6 self-center px-6 pb-6 pt-12">
          <Image className="h-40 w-36 self-center" source={require('@/assets/images/Logo.png')} contentFit="contain" />

          <View className="gap-3">
            <Text className="type-h1 text-center text-action-primary">You&apos;re all set</Text>
            <Text className="type-body-large text-center text-text-secondary">
              Your garden is ready. We&apos;ll remind you when your plants are thirsty, and your friends&apos;
              plants will show up in your feed.
            </Text>
          </View>

          <View className="mt-auto gap-2">
            <Button
              label="Start gardening"
              size="large"
              onPress={() => {
                finish();
                router.replace('/');
              }}
            />
            {goBack && <Button label="Back" variant="ghost" size="large" onPress={goBack} />}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
