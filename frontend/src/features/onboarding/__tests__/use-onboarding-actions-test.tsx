import { act, renderHook } from '@testing-library/react-native';

import * as onboardingService from '@/features/onboarding/onboarding-service';
import { useOnboardingActions } from '@/features/onboarding/use-onboarding-actions';
import { OnboardingStoreProvider, useOnboardingStore } from '@/stores/onboarding-store';

jest.mock('@/features/onboarding/onboarding-service');

const mockedService = jest.mocked(onboardingService);

afterEach(() => {
  jest.resetAllMocks();
});

function renderWithStore() {
  return renderHook(() => ({ actions: useOnboardingActions(), store: useOnboardingStore() }), {
    wrapper: OnboardingStoreProvider,
  });
}

describe('useOnboardingActions', () => {
  it('endTour ends the tour and saves it as done', async () => {
    mockedService.completeOnboarding.mockResolvedValue(undefined);
    const { result } = await renderWithStore();
    await act(async () => result.current.store.start());

    await act(async () => result.current.actions.endTour(false));

    expect(result.current.store.step).toBeNull();
    expect(mockedService.completeOnboarding).toHaveBeenCalledWith({ skipped: false });
  });
});
