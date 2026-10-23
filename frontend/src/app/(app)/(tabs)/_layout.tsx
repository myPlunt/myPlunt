import { Redirect, usePathname, useRouter, useSegments } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect } from 'react';

import { BottomTabBar } from '@/components/layout/bottom-tab-bar';
import { useTheme } from '@/hooks/use-theme';
import { useNetworkStore } from '@/stores/network-store';
import { useOnboardingStore } from '@/stores/onboarding-store';

const WORKS_OFFLINE = /^\/(garden|plant\/[^/]+(\/(waterings|growth))?)$/;

export default function TabsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const onTab = useSegments()[1] === '(tabs)';
  const { step } = useOnboardingStore();
  const { isOffline } = useNetworkStore();

  // navigate, not push, so a tab can't stack up if the tabs mount again.
  useEffect(() => {
    if (step === 'bio') router.navigate('/profile');
    if (step === 'pluntdex') router.navigate('/pluntdex');
  }, [step, router]);

  useEffect(() => {
    if (!isOffline || step !== null || WORKS_OFFLINE.test(pathname)) return;
    // navigate from a page over the tabs would open them twice; dismissTo does nothing on a tab.
    if (onTab) {
      router.navigate('/garden');
    } else {
      router.dismissTo('/garden');
    }
  }, [isOffline, step, pathname, onTab, router]);

  // A redirect replaces instead of pushing, so the page is there once however often the tabs mount.
  if (step === 'welcome') return <Redirect href="/welcome" />;
  if (step === 'done') return <Redirect href="/tour-done" />;

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
