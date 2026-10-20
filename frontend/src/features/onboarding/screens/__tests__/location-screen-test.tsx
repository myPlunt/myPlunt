import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { shareLocation } from '@/features/onboarding/location-service';
import { useOnboardingStore } from '@/stores/onboarding-store';

import { LocationScreen } from '../location-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/onboarding/location-service');
jest.mock('@/stores/onboarding-store', () => ({
  ...jest.requireActual('@/stores/onboarding-store'),
  useOnboardingStore: jest.fn(),
}));

const mockedUseRouter = jest.mocked(useRouter);
const mockedShareLocation = jest.mocked(shareLocation);
const mockedUseOnboardingStore = jest.mocked(useOnboardingStore);
const back = jest.fn();
const onboarding = { step: 'location' as const, start: jest.fn(), next: jest.fn(), finish: jest.fn() };
const user = userEvent.setup();

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ back } as unknown as ReturnType<typeof useRouter>);
  mockedUseOnboardingStore.mockReturnValue(onboarding);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('LocationScreen', () => {
  it('shares the city, then moves on and leaves', async () => {
    mockedShareLocation.mockResolvedValue(true);
    await render(<LocationScreen />);

    await user.press(screen.getByRole('button', { name: 'Share my city' }));

    expect(mockedShareLocation).toHaveBeenCalled();
    expect(onboarding.next).toHaveBeenCalled();
    expect(back).toHaveBeenCalled();
  });

  it('stays on the page and shows the error when saving fails', async () => {
    mockedShareLocation.mockRejectedValue(new Error('network down'));
    await render(<LocationScreen />);

    await user.press(screen.getByRole('button', { name: 'Share my city' }));

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeOnTheScreen();
    expect(onboarding.next).not.toHaveBeenCalled();
    expect(back).not.toHaveBeenCalled();
  });
});
