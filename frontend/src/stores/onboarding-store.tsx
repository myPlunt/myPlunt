import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

// The tour's numbered steps in order. Each screen shows its card while `step` is its own.
export const ONBOARDING_STEPS = ['bio', 'avatar', 'location', 'friends', 'plant', 'photo', 'water', 'pluntdex'] as const;

export type TourStep = (typeof ONBOARDING_STEPS)[number];
// 'welcome' comes before the numbered steps and 'done' (the "You're all set" page) after them,
// so neither is counted in "Step x of N".
export type OnboardingStep = 'welcome' | TourStep | 'done';

interface OnboardingStore {
  /** The step being shown, or null when no tour is running. */
  step: OnboardingStep | null;
  /** The step the user came from, which Back returns to; null on the welcome page. */
  previous: OnboardingStep | null;
  /** The plant added in the first-plant step, whose page the photo step is on. */
  plantId: string | null;
  /** Starts the tour on the welcome page; a tour that's already running carries on. */
  start: () => void;
  /**
   * Moves to the next step; after the last one comes the "You're all set" page, then the tour
   * ends. The first-plant step passes the plant it added.
   */
  next: (plantId?: string) => void;
  /** Moves past `step` and the steps before it, e.g. the steps that need a plant when none was added. */
  skipPast: (step: TourStep) => void;
  /** Goes back to the step the user came from (skipped steps stay skipped). */
  back: () => void;
  finish: () => void;
}

interface TourState {
  step: OnboardingStep | null;
  /** The steps the user went through, oldest first; Back pops the last. */
  history: OnboardingStep[];
  plantId: string | null;
}

const NO_TOUR: TourState = { step: null, history: [], plantId: null };

function after(step: OnboardingStep): OnboardingStep | null {
  if (step === 'done') return null;
  if (step === 'welcome') return ONBOARDING_STEPS[0];
  return ONBOARDING_STEPS[ONBOARDING_STEPS.indexOf(step) + 1] ?? 'done';
}

// Moving on remembers where the user was, so Back can return there.
function moveTo(state: TourState, to: OnboardingStep | null): TourState {
  if (state.step === null) return state;
  if (to === null) return NO_TOUR;
  return { ...state, step: to, history: [...state.history, state.step] };
}

const OnboardingStoreContext = createContext<OnboardingStore | undefined>(undefined);

// The tour's progress lives in memory only: closing the app mid-tour starts it over from the
// welcome page on the next launch (see useResumeTour).
export function OnboardingStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TourState>(NO_TOUR);

  const start = useCallback(
    () => setState((current) => (current.step === null ? { ...NO_TOUR, step: 'welcome' } : current)),
    [],
  );
  const next = useCallback(
    (plantId?: string) =>
      setState((current) => {
        const moved = moveTo(current, current.step === null ? null : after(current.step));
        return plantId && moved.step !== null ? { ...moved, plantId } : moved;
      }),
    [],
  );
  const skipPast = useCallback((last: TourStep) => setState((current) => moveTo(current, after(last))), []);
  const back = useCallback(
    () =>
      setState((current) =>
        current.history.length === 0
          ? current
          : { ...current, step: current.history[current.history.length - 1], history: current.history.slice(0, -1) },
      ),
    [],
  );
  const finish = useCallback(() => setState(NO_TOUR), []);

  const value = useMemo<OnboardingStore>(
    () => ({
      step: state.step,
      previous: state.history[state.history.length - 1] ?? null,
      plantId: state.plantId,
      start,
      next,
      skipPast,
      back,
      finish,
    }),
    [state, start, next, skipPast, back, finish],
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
