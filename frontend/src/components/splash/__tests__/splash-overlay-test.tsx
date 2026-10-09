import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';

import { SplashOverlay } from '../splash-overlay';

jest.mock('expo-splash-screen', () => ({ hideAsync: jest.fn() }));
// The worklets native module doesn't exist under Jest (and Reanimated's own mock
// still loads it), so stub just the pieces the overlay uses.
jest.mock('react-native-worklets', () => ({ scheduleOnRN: (fn: () => void) => fn() }));
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native');
  class Keyframe {
    duration() {
      return this;
    }
    withCallback() {
      return this;
    }
  }
  return { __esModule: true, default: { View }, Easing: { elastic: () => () => 0 }, Keyframe };
});

const mockedHideAsync = jest.mocked(SplashScreen.hideAsync);

beforeEach(() => {
  mockedHideAsync.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('SplashOverlay', () => {
  it('hides the native splash screen once the overlay has laid out', async () => {
    await render(<SplashOverlay />);

    await act(async () => {
      fireEvent(screen.getByTestId('splash-overlay'), 'layout');
    });

    expect(mockedHideAsync).toHaveBeenCalled();
  });
});
