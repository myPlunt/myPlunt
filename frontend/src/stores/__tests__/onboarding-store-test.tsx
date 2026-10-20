import { act, renderHook } from '@testing-library/react-native';

import { ONBOARDING_STEPS, OnboardingStoreProvider, useOnboardingStore } from '@/stores/onboarding-store';

async function renderStore() {
  const { result } = await renderHook(() => useOnboardingStore(), { wrapper: OnboardingStoreProvider });
  return result;
}

describe('OnboardingStore', () => {
  it('goes from the welcome page through every step to the "all set" page, then ends', async () => {
    const store = await renderStore();

    await act(() => store.current.start());
    expect(store.current.step).toBe('welcome');
    for (const step of ONBOARDING_STEPS) {
      await act(() => store.current.next());
      expect(store.current.step).toBe(step);
    }
    await act(() => store.current.next());
    expect(store.current.step).toBe('done');
    await act(() => store.current.next());
    expect(store.current.step).toBeNull();
  });

  it('skips the steps that need a plant, and a skipped tour ends without the "all set" page', async () => {
    const store = await renderStore();
    await act(() => store.current.start());

    await act(() => store.current.skipPast('water'));
    expect(store.current.step).toBe('pluntdex');
    await act(() => store.current.finish());
    expect(store.current.step).toBeNull();
  });
});
