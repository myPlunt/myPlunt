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
      {/* Opened from a plant card in the garden. */}
      <Stack.Screen name="plant/[id]/index" />
      {/* Opened from the pencil on a plant's details; a sheet like adding a plant. */}
      <Stack.Screen name="plant/[id]/edit" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
