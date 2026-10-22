import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';

export function useNotificationLinks() {
  const router = useRouter();
  // Also holds the tap that launched the app, so it works from a closed app too.
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    const url = response?.notification.request.content.data?.url;
    if (response?.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER || typeof url !== 'string') return;
    router.push(url as Href);
    // Otherwise the same tap would open the page again on the next sign-in.
    Notifications.clearLastNotificationResponse();
  }, [response, router]);
}
