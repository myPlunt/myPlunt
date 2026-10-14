// Global test setup: runs after the test framework is installed in each test file.
// Add shared mocks here (e.g. jest.mock('expo-font')).

// Keeps tests from sending log lines and expected failures from filling the output with warnings.
jest.mock('@/lib/logger');

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
// menu's FadeInUp and FadeOutUp), so those render as a plain View and the animation builders are no-ops.
// splash-overlay-test mocks it itself, with the pieces the overlay needs.
jest.mock('react-native-worklets', () => ({ scheduleOnRN: (fn: () => void) => fn() }));
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const animation = { delay: () => animation, duration: () => animation };
  return { __esModule: true, default: { View }, FadeInUp: animation, FadeOutUp: animation };
});
