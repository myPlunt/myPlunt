import { useOnboardingStore } from '@/stores/onboarding-store';

import { completeOnboarding } from './onboarding-service';

export function useOnboardingActions() {
  const { finish } = useOnboardingStore();

  return {
    // Ends right away, saved or not; if the save fails, the tour comes back on the next sign-in.
    endTour(skipped: boolean) {
      finish();
      completeOnboarding({ skipped }).catch(() => {});
    },
  };
}
