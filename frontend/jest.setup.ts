// Global test setup: runs after the test framework is installed in each test file.
// Add shared mocks here (e.g. jest.mock('expo-font')).

// Keeps expected request failures in tests from filling the output with warnings.
// Tests that care about logging assert on jest.mocked(logError).
jest.mock('@/lib/logger');
