import { useOnboardingStore } from '@/stores/onboarding-store';

import { completeOnboarding } from './onboarding-service';

export function useOnboardingActions() {
  const { finish } = useOnboardingStore();

  return {
    // The tour ends right away, whether or not the save reaches the backend; if it doesn't,
    // the tour comes back on the next sign-in.
    endTour(skipped: boolean) {
      finish();
      completeOnboarding({ skipped }).catch(() => {});
    },
  };
}
