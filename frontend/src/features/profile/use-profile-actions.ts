import { ApiError } from '@/lib/auth/api-client';
import type {
  ChangeEmailRequest,
  NotificationSettings,
  UpdateAvatarRequest,
  UpdateProfileRequest,
} from '@/lib/user/types';
import { useAuthStore } from '@/stores/auth-store';

import * as profileService from './profile-service';

export function useProfileActions() {
  const { setUnauthenticated } = useAuthStore();

  async function signOutIfExpired<T>(request: Promise<T>): Promise<T> {
    try {
      return await request;
    } catch (err) {
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

    updateAvatar(request: UpdateAvatarRequest) {
      return signOutIfExpired(profileService.updateAvatar(request));
    },

    removeAvatar() {
      return signOutIfExpired(profileService.removeAvatar());
    },

    updateNotificationSettings(settings: NotificationSettings) {
      return signOutIfExpired(profileService.updateNotificationSettings(settings));
    },
  };
}
