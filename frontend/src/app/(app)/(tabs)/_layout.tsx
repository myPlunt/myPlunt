import { useRouter } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect } from 'react';

import { BottomTabBar } from '@/components/layout/bottom-tab-bar';
import { useTheme } from '@/hooks/use-theme';
import { useOnboardingStore } from '@/stores/onboarding-store';

export default function TabsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const { step } = useOnboardingStore();

  // The tour opens with the welcome page, then its first step is on the profile, not
  // the feed the tabs open on. The city page goes back to the profile when it's done,
  // and the friends step opens on top of it.
  useEffect(() => {
    if (step === 'welcome') router.push('/welcome');
    if (step === 'bio') router.navigate('/profile');
    if (step === 'friends') router.push('/friends');
  }, [step, router]);

  // Screens render their own AppHeader, so the navigator's header stays hidden.
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: theme.background } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="pluntdex" />
      <Tabs.Screen name="garden" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
