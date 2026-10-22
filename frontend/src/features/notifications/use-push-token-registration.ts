import { useEffect } from 'react';
import { AppState } from 'react-native';

import { logWarning } from '@/lib/logger';

import { registerPushToken } from './push-token-service';

export function usePushTokenRegistration() {
  useEffect(() => {
    const register = () =>
      registerPushToken().catch(() => logWarning('push_token_register_failed'));
    register();
    // Again on return: notifications may have just been allowed, or the time zone changed.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') register();
    });
    return () => subscription.remove();
  }, []);
}
