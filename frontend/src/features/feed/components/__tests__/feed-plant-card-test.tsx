import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { logAction } from '@/lib/logger';
import type { PlantPost } from '@/lib/post/types';

import { FeedPlantCard } from '../feed-plant-card';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

const push = jest.fn();
const user = userEvent.setup();

function post(friendship: PlantPost['author']['friendship']): PlantPost {
  return {
    id: 'post1',
    type: 'new_plant',
    author: { id: 'u1', username: 'emma', bio: null, avatarUrl: null, friendship },
    plantId: 'plant1',
    plantName: 'Gus the Fern',
    body: null,
    photoUrl: null,
    commentCount: 3,
    createdAt: '2026-10-19T10:00:00Z',
  };
}

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('FeedPlantCard', () => {
  it("opens the post's own page, a friend's too", async () => {
    await render(<FeedPlantCard post={post('friends')} />);

    await user.press(screen.getByRole('button', { name: 'Gus the Fern, 3 comments' }));

    expect(push).toHaveBeenCalledWith({ pathname: '/post/[id]', params: { id: 'post1' } });
    expect(logAction).toHaveBeenCalledWith('post_opened', { context: { post_id: 'post1', post_type: 'new_plant' } });
  });
});
