import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useOnboardingStore } from '@/stores/onboarding-store';

import { WelcomeScreen } from '../welcome-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/stores/onboarding-store', () => ({ useOnboardingStore: jest.fn() }));

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseOnboardingStore = jest.mocked(useOnboardingStore);
const replace = jest.fn();
const onboarding = { step: 'welcome' as const, start: jest.fn(), next: jest.fn(), finish: jest.fn() };
const user = userEvent.setup();

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ replace } as unknown as ReturnType<typeof useRouter>);
  mockedUseOnboardingStore.mockReturnValue(onboarding);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('WelcomeScreen', () => {
  it('"Show me around" moves on to the first step', async () => {
    await render(<WelcomeScreen />);

    await user.press(screen.getByRole('button', { name: 'Show me around' }));

    expect(onboarding.next).toHaveBeenCalled();
    expect(onboarding.finish).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/profile');
  });

  it('"Skip the tour" ends the tour', async () => {
    await render(<WelcomeScreen />);

    await user.press(screen.getByRole('button', { name: 'Skip the tour' }));

    expect(onboarding.finish).toHaveBeenCalled();
    expect(onboarding.next).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/');
  });
});
