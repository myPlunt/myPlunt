jest.mock('@/lib/logger');
// Uses expo-router's focus effect, which screen tests mock away.
jest.mock('@/features/onboarding/use-tour-back-lock');

// In memory, emptied after each test. Plain functions, not jest.fn, so jest.resetAllMocks() leaves
// them working.
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

// Online by default. Plain functions, for the same reason as above.
jest.mock('expo-network', () => ({
  useNetworkState: () => ({ isConnected: true, isInternetReachable: true }),
  getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
}));

// Even importing it fails in Jest (its classes extend a native object). use-recent-photos-test drives it.
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  Query: jest.fn(),
  AssetField: { MEDIA_TYPE: 'mediaType', CREATION_TIME: 'creationTime' },
  MediaType: { IMAGE: 'image' },
}));

// JS-driven animations keep updating after a test ends (act() warnings), so timings jump to their end.
// Patched on the module, not with jest.spyOn, so jest.resetAllMocks() leaves it alone.
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

// Reanimated's own mock still loads the worklets native module, so it's replaced: Animated.View is a
// plain View and the animation builders are no-ops. splash-overlay-test mocks it itself.
jest.mock('react-native-worklets', () => ({ scheduleOnRN: (fn: () => void) => fn() }));
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const animation = { delay: () => animation, duration: () => animation, withCallback: () => animation };
  return {
    __esModule: true,
    default: { View },
    FadeInUp: animation,
    FadeOutUp: animation,
    FadeOutDown: animation,
    Keyframe: function Keyframe() {
      return animation;
    },
  };
});

// Warns on import and needs a native module. Permission-flow tests mock it themselves.
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
