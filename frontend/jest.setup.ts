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
