import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useInbox } from '@/features/notifications/use-inbox';

import { InboxScreen } from '../inbox-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/notifications/use-inbox');

const user = userEvent.setup();
const push = jest.fn();

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('InboxScreen', () => {
  it('lists the notifications and opens the page one points to', async () => {
    jest.mocked(useInbox).mockReturnValue({
      notifications: [
        {
          id: 'n1',
          title: 'New friend request 🌱',
          body: 'jane wants to be friends.',
          url: '/friends?tab=requests',
          createdAt: new Date().toISOString(),
        },
      ],
      error: null,
      isLoading: false,
      isRefreshing: false,
      refresh: jest.fn(),
      retry: jest.fn(),
    });
    await render(<InboxScreen />);

    await user.press(screen.getByRole('button', { name: 'New friend request 🌱 jane wants to be friends.' }));

    expect(push).toHaveBeenCalledWith('/friends?tab=requests');
  });
});
