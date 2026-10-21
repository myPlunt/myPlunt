import { Stack } from 'expo-router';

import { useNotificationLinks } from '@/features/notifications/use-notification-links';
import { usePushTokenRegistration } from '@/features/notifications/use-push-token-registration';
import { useResumeTour } from '@/features/onboarding/use-resume-tour';
import { useTheme } from '@/hooks/use-theme';

export default function AppLayout() {
  const theme = useTheme();
  // Mounted once per sign-in, behind the auth gate.
  useResumeTour();
  usePushTokenRegistration();
  useNotificationLinks();

  // Screens render their own AppHeader, so the native header (and its iOS
  // Liquid Glass back button) stays hidden on both platforms.
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
      <Stack.Screen name="(tabs)" />
      {/* Page 0 of the tour, which the tabs layout redirects to after registering. No swipe back:
          the only ways out are its two buttons, so the tour can't be left half-started. */}
      <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
      {/* The tour's last page, which the tabs layout redirects to after its last step; no swipe
          back, so the tour can't be left half-finished either. */}
      <Stack.Screen name="tour-done" options={{ gestureEnabled: false }} />
      {/* Tour step 3, opened from Edit profile; no swipe back for the same reason. */}
      <Stack.Screen name="location" options={{ gestureEnabled: false }} />
      {/* Tour step 4, opened from the location step; no swipe back either. */}
      <Stack.Screen name="notifications" options={{ gestureEnabled: false }} />
      <Stack.Screen name="settings" />
      {/* The notifications list, opened from the bell in the profile's menu. */}
      <Stack.Screen name="inbox" />
      <Stack.Screen name="edit-profile" />
      {/* Opened from the people icon in the profile's menu, also during the tour's friends
          step; no swipe back during the step (see FriendsScreen). */}
      <Stack.Screen name="friends" />
      {/* Opened from a person in the Friends search. */}
      <Stack.Screen name="user/[id]" />
      {/* Opened from "Watering calendar" under the streak on the profile. */}
      <Stack.Screen name="watering-calendar" />
      {/* Opened from the tab bar's Add button. iOS shows it as a sheet that can be
          swiped down; Android has no sheet, so it slides in full screen. */}
      <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      {/* Opened from "I have a question" on the feed; a sheet like adding a plant. */}
      <Stack.Screen name="ask" options={{ presentation: 'modal' }} />
      {/* Opened from a plant card in the garden. */}
      <Stack.Screen name="plant/[id]/index" />
      {/* Opened from the pencil on a plant's details; a sheet like adding a plant. */}
      <Stack.Screen name="plant/[id]/edit" options={{ presentation: 'modal' }} />
      {/* Opened from "Watering history" on a plant's details. */}
      <Stack.Screen name="plant/[id]/waterings" />
      {/* Opened from "See all" in a plant's Growth section. */}
      <Stack.Screen name="plant/[id]/growth" />
      {/* Opened from "Add" in a plant's Growth section; a sheet like editing the plant. */}
      <Stack.Screen name="plant/[id]/add-photo" options={{ presentation: 'modal' }} />
      {/* Opened from "Edit" on a photo in the growth journal; a sheet like adding one. */}
      <Stack.Screen name="plant/[id]/photo/[photoId]" options={{ presentation: 'modal' }} />
      {/* Opened from a post on the feed or the profile. */}
      <Stack.Screen name="post/[id]" />
      {/* Opened from a card in the Pluntdex. */}
      <Stack.Screen name="species/[id]" />
    </Stack>
  );
}
