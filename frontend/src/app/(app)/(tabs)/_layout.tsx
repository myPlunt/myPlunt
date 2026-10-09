import { Tabs } from 'expo-router/js-tabs';

import { BottomTabBar } from '@/components/layout/bottom-tab-bar';
import { useTheme } from '@/hooks/use-theme';

export default function TabsLayout() {
  const theme = useTheme();

  // Screens render their own AppHeader, so the navigator's header stays hidden.
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: theme.background } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="garden" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
