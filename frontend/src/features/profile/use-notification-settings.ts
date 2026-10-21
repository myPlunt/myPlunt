import { useEffect, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import { logFailedUi } from '@/lib/logger';
import type { NotificationSettings } from '@/lib/user/types';
import { useAuthStore } from '@/stores/auth-store';

import * as profileService from './profile-service';
import { useProfileActions } from './use-profile-actions';

/** Loads the notification settings and saves each toggle straight away. */
export function useNotificationSettings() {
  const { setUnauthenticated } = useAuthStore();
  const { updateNotificationSettings } = useProfileActions();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    profileService
      .getNotificationSettings()
      .then((result) => {
        if (!cancelled) setSettings(result);
      })
      .catch((err) => {
        if (cancelled) return;
        // apiFetch already tried a refresh; a 401 here means the session is gone.
        if (err instanceof ApiError && err.status === 401) {
          setUnauthenticated();
          return;
        }
        setError(describeError(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt, setUnauthenticated]);

  return {
    settings,
    error,
    isLoading,
    retry() {
      setError(null);
      setIsLoading(true);
      setAttempt((n) => n + 1);
    },
    // Flips the switch at once and puts it back if the save fails.
    async toggle(key: keyof NotificationSettings, value: boolean) {
      if (!settings) return;
      const previous = settings;
      setSettings({ ...settings, [key]: value });
      setError(null);
      try {
        await updateNotificationSettings({ ...settings, [key]: value });
      } catch (err) {
        logFailedUi('notification_settings_update_failed_ui', err);
        setSettings(previous);
        setError(describeError(err));
      }
    },
  };
}
