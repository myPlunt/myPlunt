// The tabs layout's own test. It lives here, not under src/app, where expo-router would take
// it for a screen.
import { act, render } from '@testing-library/react-native';
import { getNetworkStateAsync } from 'expo-network';
import { useRouter } from 'expo-router';

import TabsLayout from '@/app/(app)/(tabs)/_layout';
import { useOnboardingStore } from '@/stores/onboarding-store';

jest.mock('expo-network', () => ({ getNetworkStateAsync: jest.fn() }));
jest.mock('expo-router', () => ({ Redirect: () => null, useRouter: jest.fn() }));
jest.mock('expo-router/js-tabs', () => {
  function Tabs() {
    return null;
  }
  Tabs.Screen = function Screen() {
    return null;
  };
  return { Tabs };
});
jest.mock('@/stores/onboarding-store', () => ({ useOnboardingStore: jest.fn() }));

const navigate = jest.fn();

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ navigate } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(useOnboardingStore).mockReturnValue({ step: null } as ReturnType<typeof useOnboardingStore>);
});

afterEach(() => {
  jest.resetAllMocks();
});

it('opens on the garden when the app starts offline', async () => {
  jest.mocked(getNetworkStateAsync).mockResolvedValue({ isConnected: false, isInternetReachable: false });
  await render(<TabsLayout />);
  await act(async () => {});

  expect(navigate).toHaveBeenCalledWith('/garden');
});

it('stays on the feed when the app starts online', async () => {
  jest.mocked(getNetworkStateAsync).mockResolvedValue({ isConnected: true, isInternetReachable: true });
  await render(<TabsLayout />);
  await act(async () => {});

  expect(getNetworkStateAsync).toHaveBeenCalled();
  expect(navigate).not.toHaveBeenCalled();
});
