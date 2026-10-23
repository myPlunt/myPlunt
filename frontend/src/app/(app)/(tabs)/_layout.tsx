import { getNetworkStateAsync } from 'expo-network';
import { Redirect, useRouter } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { BottomTabBar } from '@/components/layout/bottom-tab-bar';
import { WeatherOverlay } from '@/components/weather/weather-overlay';
import { useWeather } from '@/features/weather/use-weather';
import { useTheme } from '@/hooks/use-theme';
import { isOfflineState } from '@/stores/network-store';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useWeatherVisualsStore } from '@/stores/weather-visuals-store';

export default function TabsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const { step } = useOnboardingStore();
  const weather = useWeather();
  const weatherVisuals = useWeatherVisualsStore();

  // navigate, not push, so a tab can't stack up if the tabs mount again.
  useEffect(() => {
    if (step === 'bio') router.navigate('/profile');
    if (step === 'pluntdex') router.navigate('/pluntdex');
  }, [step, router]);

  // The feed can't load offline, so an offline launch opens the garden. Only at launch.
  const checkedLaunch = useRef(false);
  useEffect(() => {
    if (checkedLaunch.current) return;
    checkedLaunch.current = true;
    if (step !== null) return;
    getNetworkStateAsync().then((network) => {
      if (isOfflineState(network)) router.navigate('/garden');
    });
  }, [step, router]);

  // A redirect replaces instead of pushing, so the page is there once however often the tabs mount.
  if (step === 'welcome') return <Redirect href="/welcome" />;
  if (step === 'done') return <Redirect href="/tour-done" />;

  return (
    <View className="flex-1">
      <Tabs
        tabBar={(props) => <BottomTabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: theme.background } }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="pluntdex" />
        <Tabs.Screen name="garden" />
        <Tabs.Screen name="profile" />
      </Tabs>
      {weatherVisuals.enabled && <WeatherOverlay condition={weather} />}
    </View>
  );
}
