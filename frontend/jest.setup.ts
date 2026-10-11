// Global test setup: runs after the test framework is installed in each test file.
// Add shared mocks here (e.g. jest.mock('expo-font')).

// Keeps expected request failures in tests from filling the output with warnings.
// Tests that care about logging assert on jest.mocked(logError).
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
