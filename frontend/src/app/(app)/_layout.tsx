import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { sendWaterings } from '@/features/garden/watering-outbox';
import { useNotificationLinks } from '@/features/notifications/use-notification-links';
import { usePushTokenRegistration } from '@/features/notifications/use-push-token-registration';
import { useResumeTour } from '@/features/onboarding/use-resume-tour';
import { useTheme } from '@/hooks/use-theme';

export default function AppLayout() {
  const theme = useTheme();
  useResumeTour();
  usePushTokenRegistration();
  useNotificationLinks();
  // Waterings left from an offline session, even when the garden isn't opened.
  useEffect(() => {
    sendWaterings();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
      <Stack.Screen name="(tabs)" />
      {/* No swipe back on the tour's pages, so the tour can't be left half-way. */}
      <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
      <Stack.Screen name="tour-done" options={{ gestureEnabled: false }} />
      <Stack.Screen name="location" options={{ gestureEnabled: false }} />
      <Stack.Screen name="notifications" options={{ gestureEnabled: false }} />
      <Stack.Screen name="settings" />
      <Stack.Screen name="inbox" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="friends" />
      <Stack.Screen name="user/[id]" />
      <Stack.Screen name="watering-calendar" />
      <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="ask" options={{ presentation: 'modal' }} />
      <Stack.Screen name="plant/[id]/index" />
      <Stack.Screen name="plant/[id]/edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="plant/[id]/waterings" />
      <Stack.Screen name="plant/[id]/growth" />
      <Stack.Screen name="plant/[id]/add-photo" options={{ presentation: 'modal' }} />
      <Stack.Screen name="plant/[id]/photo/[photoId]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="post/[id]" />
      <Stack.Screen name="species/[id]" />
    </Stack>
  );
}
