import { useRouter } from 'expo-router';

import { useOnboardingStore } from '@/stores/onboarding-store';

/**
 * Back to the tour's previous step, reopening its screen; null on the welcome page, which has
 * nothing before it. Every step's screen is reached from the tabs, so this closes whatever is
 * open on top of them and opens the step's screen from there.
 */
export function useTourBack() {
  const router = useRouter();
  const { previous, plantId, back } = useOnboardingStore();
  if (!previous) return null;

  return () => {
    back();
    if (router.canDismiss()) router.dismissAll();
    switch (previous) {
      case 'welcome':
        // The tabs redirect to it once the step is back to 'welcome'.
        return;
      case 'bio':
      case 'friends':
        // The friends step starts on the profile, with the menu open on the friends icon.
        router.navigate('/profile');
        return;
      case 'avatar':
        router.navigate('/profile');
        router.push('/edit-profile');
        return;
      case 'location':
        router.navigate('/profile');
        router.push('/location');
        return;
      case 'notifications':
        router.navigate('/profile');
        router.push('/notifications');
        return;
      case 'plant':
      case 'water':
        router.navigate('/garden');
        return;
      case 'photo':
        router.navigate('/garden');
        if (plantId) router.push({ pathname: '/plant/[id]', params: { id: plantId } });
        return;
      case 'pluntdex':
        router.navigate('/pluntdex');
        return;
      case 'done':
        // Nothing comes after it, so it's never a step to go back to.
        return;
    }
  };
}
