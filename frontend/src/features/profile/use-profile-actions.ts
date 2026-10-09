import { ApiError } from '@/lib/auth/api-client';
import type { ChangeEmailRequest, UpdateProfileRequest, User } from '@/lib/user/types';
import { useAuthStore } from '@/stores/auth-store';

import * as profileService from './profile-service';

export function useProfileActions() {
  const { setUnauthenticated } = useAuthStore();

  async function signOutIfExpired(request: Promise<User>): Promise<User> {
    try {
      return await request;
    } catch (err) {
      // apiFetch already tried a refresh; a 401 here means the session is gone.
      if (err instanceof ApiError && err.status === 401) {
        setUnauthenticated();
      }
      throw err;
    }
  }

  return {
    updateProfile(request: UpdateProfileRequest) {
      return signOutIfExpired(profileService.updateProfile(request));
    },

    changeEmail(request: ChangeEmailRequest) {
      return signOutIfExpired(profileService.changeEmail(request));
    },
  };
}
