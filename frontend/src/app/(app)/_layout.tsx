import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

export default function AppLayout() {
  const theme = useTheme();

  // Screens render their own AppHeader, so the native header (and its iOS
  // Liquid Glass back button) stays hidden on both platforms.
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="edit-profile" />
      {/* Opened from the tab bar's Add button. iOS shows it as a sheet that can be
          swiped down; Android has no sheet, so it slides in full screen. */}
      <Stack.Screen name="add" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
