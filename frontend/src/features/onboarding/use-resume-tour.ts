import { useEffect } from 'react';

import { getCurrentUser } from '@/features/profile/profile-service';
import { useOnboardingStore } from '@/stores/onboarding-store';

/**
 * Starts the tour once per sign-in (a login, or opening the app signed in) for an account that
 * hasn't finished or skipped it, e.g. one that closed the app mid-tour or registered on
 * another phone.
 */
export function useResumeTour() {
  const { start } = useOnboardingStore();

  useEffect(() => {
    // Not knowing is no reason to interrupt the user with the tour.
    getCurrentUser()
      .then((user) => {
        if (!user.onboardingCompleted) start();
      })
      .catch(() => {});
  }, [start]);
}
