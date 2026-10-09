import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { AppHeader } from '../app-header';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

const mockedUseRouter = jest.mocked(useRouter);
const back = jest.fn();
const replace = jest.fn();
const canGoBack = jest.fn();
const user = userEvent.setup();

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ back, replace, canGoBack } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('AppHeader', () => {
  it('shows the page name as the header, without the app name', async () => {
    await render(<AppHeader title="Settings" />);

    expect(screen.getByRole('header', { name: 'Settings' })).toBeOnTheScreen();
    expect(screen.queryByText('myPlunt')).toBeNull();
  });

  it('goes back one screen when the logo is pressed', async () => {
    canGoBack.mockReturnValue(true);
    await render(<AppHeader title="Settings" showBack />);

    await user.press(screen.getByRole('button', { name: 'Go back' }));

    expect(back).toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('falls back to the feed when there is no screen to go back to', async () => {
    canGoBack.mockReturnValue(false);
    await render(<AppHeader title="Settings" showBack />);

    await user.press(screen.getByRole('button', { name: 'Go back' }));

    expect(replace).toHaveBeenCalledWith('/');
    expect(back).not.toHaveBeenCalled();
  });

  it('shows the logo as plain content without showBack', async () => {
    await render(<AppHeader title="Feed" />);

    expect(screen.queryByRole('button', { name: 'Go back' })).toBeNull();
  });

  it('renders the right-hand content', async () => {
    await render(<AppHeader title="Feed" right={<Text>Right side</Text>} />);

    expect(screen.getByText('Right side')).toBeOnTheScreen();
  });
});
