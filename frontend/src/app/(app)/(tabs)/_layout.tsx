import { getNetworkStateAsync } from 'expo-network';
import { Redirect, useRouter } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect, useRef } from 'react';

import { BottomTabBar } from '@/components/layout/bottom-tab-bar';
import { useTheme } from '@/hooks/use-theme';
import { isOfflineState } from '@/stores/network-store';
import { useOnboardingStore } from '@/stores/onboarding-store';

export default function TabsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const { step } = useOnboardingStore();

  // The tour's first step is on the profile, not the feed the tabs open on, and its last on the
  // PluntDex, reached from the garden however the watering step ended (or was skipped).
  // navigate, not push, so a tab can't stack up if the tabs mount again.
  useEffect(() => {
    if (step === 'bio') router.navigate('/profile');
    if (step === 'pluntdex') router.navigate('/pluntdex');
  }, [step, router]);

  // The tabs open on the feed, which can't load offline, so an app started without a connection
  // opens on the garden instead. Only at launch: losing the connection later doesn't move anyone.
  const checkedLaunch = useRef(false);
  useEffect(() => {
    if (checkedLaunch.current) return;
    checkedLaunch.current = true;
    if (step !== null) return;
    getNetworkStateAsync().then((network) => {
      if (isOfflineState(network)) router.navigate('/garden');
    });
  }, [step, router]);

  // The tour opens with the welcome page in place of the tabs. A redirect replaces instead of
  // pushing, so it's there once however often the tabs mount; leaving it brings the tabs back.
  if (step === 'welcome') return <Redirect href="/welcome" />;
  // The same for the "You're all set" page that ends a tour taken to the end (not a skipped one).
  if (step === 'done') return <Redirect href="/tour-done" />;

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
