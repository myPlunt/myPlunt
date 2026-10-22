import { render, screen, userEvent } from '@testing-library/react-native';
import { usePathname, useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { BottomTabBar } from '@/components/layout/bottom-tab-bar';
import { useNetworkStore } from '@/stores/network-store';
import { useOnboardingStore } from '@/stores/onboarding-store';

jest.mock('expo-router', () => ({ usePathname: jest.fn(), useRouter: jest.fn() }));
jest.mock('@/stores/network-store', () => ({ useNetworkStore: jest.fn() }));
jest.mock('@/stores/onboarding-store', () => ({ useOnboardingStore: jest.fn() }));

const explainOffline = jest.fn();
const navigate = jest.fn();
const push = jest.fn();
const user = userEvent.setup();

// The bar on the garden tab, with or without a connection.
function renderBar(isOffline: boolean) {
  jest.mocked(useNetworkStore).mockReturnValue({ isOffline, reconnects: 0, notice: null, explainOffline });
  const routes = ['index', 'pluntdex', 'garden', 'profile'].map((name) => ({ key: name, name, params: undefined }));
  const props = {
    state: { index: 2, routes },
    navigation: { emit: () => ({ defaultPrevented: false }), navigate },
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
    descriptors: {},
  } as unknown as BottomTabBarProps;
  return render(<BottomTabBar {...props} />);
}

beforeEach(() => {
  jest.mocked(usePathname).mockReturnValue('/garden');
  jest.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(useOnboardingStore).mockReturnValue({ step: null } as ReturnType<typeof useOnboardingStore>);
});

afterEach(() => {
  jest.resetAllMocks();
});

it('offline, marks everything but the garden as not working offline', async () => {
  await renderBar(true);

  expect(screen.getAllByHintText("Doesn't work offline").map((tab) => tab.props.accessibilityLabel)).toEqual([
    'Feed',
    'PluntDex',
    'Add plant',
    'Profile',
  ]);
});

it('offline, says a greyed-out tab does not work offline instead of opening it', async () => {
  await renderBar(true);

  await user.press(screen.getByRole('tab', { name: 'Feed' }));
  await user.press(screen.getByRole('button', { name: 'Add plant' }));

  expect(explainOffline.mock.calls).toEqual([['Feed'], ['Adding plants']]);
  expect(navigate).not.toHaveBeenCalled();
  expect(push).not.toHaveBeenCalled();
});

it('online, opens the tabs as usual', async () => {
  await renderBar(false);

  await user.press(screen.getByRole('tab', { name: 'Feed' }));

  expect(navigate).toHaveBeenCalledWith('index', undefined);
  expect(explainOffline).not.toHaveBeenCalled();
  expect(screen.queryAllByHintText("Doesn't work offline")).toHaveLength(0);
});
