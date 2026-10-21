import { useEffect } from 'react';
import { AppState } from 'react-native';

import { logWarning } from '@/lib/logger';

import { registerPushToken } from './push-token-service';

/** Keeps the backend's copy of this phone's push token current while signed in. */
export function usePushTokenRegistration() {
  useEffect(() => {
    const register = () =>
      registerPushToken().catch(() => logWarning('push_token_register_failed'));
    register();
    // Again on return: notifications may have just been allowed (the system prompt or the phone's
    // settings), or the user may be in another time zone.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') register();
    });
    return () => subscription.remove();
  }, []);
}
