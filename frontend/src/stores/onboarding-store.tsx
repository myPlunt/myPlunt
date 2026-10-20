import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

// The tour's numbered steps in order. Each screen shows its card while `step` is its own.
export const ONBOARDING_STEPS = ['bio', 'avatar', 'location', 'friends', 'plant', 'photo', 'water'] as const;

export type TourStep = (typeof ONBOARDING_STEPS)[number];
// 'welcome' comes before the numbered steps, so it isn't counted in "Step x of N".
export type OnboardingStep = 'welcome' | TourStep;

interface OnboardingStore {
  /** The step being shown, or null when no tour is running. */
  step: OnboardingStep | null;
  start: () => void;
  /** Moves to the next step; after the last one the tour ends. */
  next: () => void;
  /** Moves past `step` and the steps before it, e.g. the steps that need a plant when none was added. */
  skipPast: (step: TourStep) => void;
  finish: () => void;
}

const OnboardingStoreContext = createContext<OnboardingStore | undefined>(undefined);

// shortcut: the tour lives in memory only, so closing the app mid-tour ends it; persist
// it on the backend (onboarding_completed_at) when the last step is built.
export function OnboardingStoreProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<OnboardingStep | null>(null);

  const start = useCallback(() => setStep('welcome'), []);
  const next = useCallback(
    () =>
      setStep((current) => {
        if (current === null) return null;
        if (current === 'welcome') return ONBOARDING_STEPS[0];
        return ONBOARDING_STEPS[ONBOARDING_STEPS.indexOf(current) + 1] ?? null;
      }),
    [],
  );
  const skipPast = useCallback(
    (last: TourStep) => setStep((current) => (current === null ? null : (ONBOARDING_STEPS[ONBOARDING_STEPS.indexOf(last) + 1] ?? null))),
    [],
  );
  const finish = useCallback(() => setStep(null), []);

  const value = useMemo<OnboardingStore>(
    () => ({ step, start, next, skipPast, finish }),
    [step, start, next, skipPast, finish],
  );

  return <OnboardingStoreContext.Provider value={value}>{children}</OnboardingStoreContext.Provider>;
}

export function useOnboardingStore(): OnboardingStore {
  const context = useContext(OnboardingStoreContext);
  if (!context) {
    throw new Error('useOnboardingStore must be used within an OnboardingStoreProvider');
  }
  return context;
}
