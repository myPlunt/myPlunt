import { useEffect } from 'react';

import { getCurrentUser } from '@/features/profile/profile-service';
import { useOnboardingStore } from '@/stores/onboarding-store';

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
