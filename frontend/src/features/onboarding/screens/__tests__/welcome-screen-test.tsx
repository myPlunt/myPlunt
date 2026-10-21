import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useOnboardingActions } from '@/features/onboarding/use-onboarding-actions';
import { useOnboardingStore } from '@/stores/onboarding-store';

import { WelcomeScreen } from '../welcome-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/stores/onboarding-store', () => ({ useOnboardingStore: jest.fn() }));
jest.mock('@/features/onboarding/use-onboarding-actions');

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseOnboardingStore = jest.mocked(useOnboardingStore);
const replace = jest.fn();
const endTour = jest.fn();
const onboarding = { step: 'welcome' as const, start: jest.fn(), next: jest.fn(), skipPast: jest.fn(), back: jest.fn(), finish: jest.fn(), previous: null, plantId: null };
const user = userEvent.setup();

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ replace } as unknown as ReturnType<typeof useRouter>);
  mockedUseOnboardingStore.mockReturnValue(onboarding);
  jest.mocked(useOnboardingActions).mockReturnValue({ endTour });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('WelcomeScreen', () => {
  it('"Show me around" moves on to the first step', async () => {
    await render(<WelcomeScreen />);

    await user.press(screen.getByRole('button', { name: 'Show me around' }));

    expect(onboarding.next).toHaveBeenCalled();
    expect(endTour).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/profile');
  });

  it('"Skip the tour" ends the tour as skipped', async () => {
    await render(<WelcomeScreen />);

    await user.press(screen.getByRole('button', { name: 'Skip the tour' }));

    expect(endTour).toHaveBeenCalledWith(true);
    expect(onboarding.next).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/');
  });
});
