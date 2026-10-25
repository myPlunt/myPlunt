// The tabs layout's own test. It lives here, not under src/app, where expo-router would take
// it for a screen.
import { render } from '@testing-library/react-native';
import { usePathname, useRouter, useSegments } from 'expo-router';

import TabsLayout from '@/app/(app)/(tabs)/_layout';
import { useNetworkStore } from '@/stores/network-store';
import { useOnboardingStore } from '@/stores/onboarding-store';

jest.mock('expo-router', () => ({
  Redirect: () => null,
  usePathname: jest.fn(),
  useRouter: jest.fn(),
  useSegments: jest.fn(),
}));
jest.mock('expo-router/js-tabs', () => {
  function Tabs() {
    return null;
  }
  Tabs.Screen = function Screen() {
    return null;
  };
  return { Tabs };
});
jest.mock('@/stores/network-store', () => ({ useNetworkStore: jest.fn() }));
jest.mock('@/stores/onboarding-store', () => ({ useOnboardingStore: jest.fn() }));
jest.mock('@/features/weather/use-weather', () => ({ useWeather: () => 'NONE' }));
jest.mock('@/stores/weather-visuals-store', () => ({ useWeatherVisualsStore: () => ({ enabled: true }) }));

const navigate = jest.fn();
const dismissTo = jest.fn();

function renderOn(pathname: string, segments: string[], { isOffline = true, step = null as string | null } = {}) {
  jest.mocked(usePathname).mockReturnValue(pathname);
  jest.mocked(useSegments).mockReturnValue(segments as ReturnType<typeof useSegments>);
  jest.mocked(useNetworkStore).mockReturnValue({ isOffline } as ReturnType<typeof useNetworkStore>);
  jest.mocked(useOnboardingStore).mockReturnValue({ step } as ReturnType<typeof useOnboardingStore>);
  return render(<TabsLayout />);
}

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ navigate, dismissTo } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => {
  jest.resetAllMocks();
});

it('offline on another tab, goes to the garden', async () => {
  await renderOn('/', ['(app)', '(tabs)']);

  expect(navigate).toHaveBeenCalledWith('/garden');
  expect(dismissTo).not.toHaveBeenCalled();
});

it('offline on a page over the tabs, forms included, goes back to the garden', async () => {
  await renderOn('/settings', ['(app)', 'settings']);
  await renderOn('/add', ['(app)', 'add']);
  await renderOn('/plant/p1/edit', ['(app)', 'plant', '[id]', 'edit']);

  expect(dismissTo.mock.calls).toEqual([['/garden'], ['/garden'], ['/garden']]);
  expect(navigate).not.toHaveBeenCalled();
});

it("offline on the garden or a plant's own pages, stays", async () => {
  await renderOn('/garden', ['(app)', '(tabs)', 'garden']);
  await renderOn('/plant/p1', ['(app)', 'plant', '[id]']);
  await renderOn('/plant/p1/waterings', ['(app)', 'plant', '[id]', 'waterings']);
  await renderOn('/plant/p1/growth', ['(app)', 'plant', '[id]', 'growth']);

  expect(navigate).not.toHaveBeenCalled();
  expect(dismissTo).not.toHaveBeenCalled();
});

it('online, stays', async () => {
  await renderOn('/settings', ['(app)', 'settings'], { isOffline: false });

  expect(navigate).not.toHaveBeenCalled();
  expect(dismissTo).not.toHaveBeenCalled();
});

it('during the tour, leaves the navigating to the tour', async () => {
  await renderOn('/pluntdex', ['(app)', '(tabs)', 'pluntdex'], { step: 'pluntdex' });

  expect(navigate).toHaveBeenCalledTimes(1);
  expect(navigate).toHaveBeenCalledWith('/pluntdex');
});
