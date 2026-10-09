import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { FeedScreen } from '../feed-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

const mockedUseRouter = jest.mocked(useRouter);
const push = jest.fn();
const user = userEvent.setup();

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('FeedScreen', () => {
  it('shows "Feed" as the page title', async () => {
    await render(<FeedScreen />);

    expect(screen.getByRole('header', { name: 'Feed' })).toBeOnTheScreen();
  });

  it('opens the profile when the user bubble is pressed', async () => {
    await render(<FeedScreen />);

    await user.press(screen.getByRole('button', { name: 'Open profile' }));

    expect(push).toHaveBeenCalledWith('/profile');
  });
});
