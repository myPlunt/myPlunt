import { renderHook, waitFor } from '@testing-library/react-native';

import { getInbox } from '@/features/notifications/inbox-service';
import { markInboxSeen, useUnreadCount } from '@/features/notifications/use-unread-count';
import type { InboxNotification } from '@/lib/notification/types';
import { clearCache } from '@/lib/offline/cache';

jest.mock('@/features/notifications/inbox-service');
// No navigator in this test: treat "focused" as "mounted".
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return { useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]) };
});

const notification = (id: string, createdAt: string): InboxNotification => ({
  id,
  fromUserId: null,
  fromAvatarUrl: null,
  title: 'Time to water',
  body: 'Gus is thirsty.',
  url: '/garden',
  createdAt,
});

afterEach(async () => {
  jest.resetAllMocks();
  await clearCache();
});

describe('useUnreadCount', () => {
  it('counts only the notifications sent after the list was last opened', async () => {
    const older = notification('n1', '2026-10-20T10:00:00Z');
    jest.mocked(getInbox).mockResolvedValue([older]);
    // Opening the list marks it seen; then two newer ones arrive (one with decimals, as the backend sends them).
    markInboxSeen([older]);
    jest
      .mocked(getInbox)
      .mockResolvedValue([notification('n3', '2026-10-21T10:00:00.123456Z'), notification('n2', '2026-10-20T10:00:00.5Z'), older]);

    const { result } = await renderHook(() => useUnreadCount());

    await waitFor(() => expect(result.current).toBe(2));
  });

  it('stays at zero when the inbox fails to load', async () => {
    jest.mocked(getInbox).mockRejectedValue(new Error('offline'));

    const { result } = await renderHook(() => useUnreadCount());

    await waitFor(() => expect(getInbox).toHaveBeenCalled());
    expect(result.current).toBe(0);
  });
});
