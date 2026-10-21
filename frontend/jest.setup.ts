// Global test setup: runs after the test framework is installed in each test file.
// Add shared mocks here (e.g. jest.mock('expo-font')).

// Keeps tests from sending log lines and expected failures from filling the output with warnings.
jest.mock('@/lib/logger');
// Locks Android's back button through expo-router's focus effect, which screen tests mock away.
jest.mock('@/features/onboarding/use-tour-back-lock');

// AsyncStorage's native module doesn't exist in Jest, and importing the library throws
// without it. This in-memory stand-in is emptied after each test, so nothing a test saved for
// offline shows up in the next one. Plain functions, not jest.fn, so jest.resetAllMocks() in
// tests leaves them working.
const mockStorage = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: async (key: string) => mockStorage.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      mockStorage.set(key, value);
    },
    getAllKeys: async () => [...mockStorage.keys()],
    multiRemove: async (keys: string[]) => {
      keys.forEach((key) => mockStorage.delete(key));
    },
  },
}));
afterEach(() => mockStorage.clear());

// expo-network is a native module too. Online by default; network-store-test and the tabs
// layout's test mock it themselves to go offline. Plain functions, for the same reason as above.
jest.mock('expo-network', () => ({
  useNetworkState: () => ({ isConnected: true, isInternetReachable: true }),
  getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
}));

// expo-media-library's classes extend a native object that doesn't exist in Jest, so even
// importing it fails. Many screens import it indirectly (the photo menu), so it's stubbed
// once here; use-recent-photos-test drives this mock.
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  Query: jest.fn(),
  AssetField: { MEDIA_TYPE: 'mediaType', CREATION_TIME: 'creationTime' },
  MediaType: { IMAGE: 'image' },
}));

// React Native's JS-driven animations (e.g. AnimatedLines) run on their own timers and keep
// updating views after a test has finished, which React reports as updates outside act().
// Tests check behaviour, not in-between frames, so a timing jumps straight to its end value.
// Patched on the module, not with jest.spyOn, so jest.resetAllMocks() in tests leaves it alone.
const { Animated } = jest.requireActual<typeof import('react-native')>('react-native');
const instantTiming: typeof Animated.timing = (value, config) => ({
  start: (callback) => {
    (value as InstanceType<typeof Animated.Value>).setValue(config.toValue as number);
    callback?.({ finished: true });
  },
  stop: () => {},
  reset: () => {},
});
// The typings mark it read-only, but the module object can be patched.
Object.assign(Animated, { timing: instantTiming });

// Reanimated needs the worklets native module, which doesn't exist in Jest (its own mock
// still loads it). Screens only use Animated.View with layout animations (e.g. the profile
// menu's FadeInUp and FadeOutUp, the offline notice's FadeOutDown), so those render as a plain View
// and the animation builders are no-ops.
// splash-overlay-test mocks it itself, with the pieces the overlay needs.
jest.mock('react-native-worklets', () => ({ scheduleOnRN: (fn: () => void) => fn() }));
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const animation = { delay: () => animation, duration: () => animation };
  return { __esModule: true, default: { View }, FadeInUp: animation, FadeOutUp: animation, FadeOutDown: animation };
});

// expo-notifications warns about Expo Go push support as soon as it's imported, and asks a native
// module Jest doesn't have. Tests that check the permission flow mock it themselves.
jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  setNotificationChannelAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  useLastNotificationResponse: jest.fn(),
  clearLastNotificationResponse: jest.fn(),
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
}));
