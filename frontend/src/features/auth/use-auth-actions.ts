import { ApiError } from '@/lib/auth/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useOnboardingStore } from '@/stores/onboarding-store';

import * as authService from './auth-service';

export function useAuthActions() {
  const { setAuthenticated, setUnauthenticated } = useAuthStore();
  const onboarding = useOnboardingStore();

  return {
    async login(credentials: Parameters<typeof authService.login>[0]) {
      await authService.login(credentials);
      setAuthenticated();
    },

    async register(details: Parameters<typeof authService.register>[0]) {
      await authService.register(details);
      onboarding.start();
      setAuthenticated();
    },

    async deleteAccount(request: Parameters<typeof authService.deleteAccount>[0]) {
      try {
        await authService.deleteAccount(request);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) setUnauthenticated();
        throw err;
      }
      onboarding.finish();
      setUnauthenticated();
    },

    async logout() {
      await authService.logout();
      onboarding.finish();
      setUnauthenticated();
    },
  };
}
