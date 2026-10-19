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
  it("opens the plant's page when the post is the user's own", async () => {
    await render(<FeedPlantCard post={post(null)} />);

    await user.press(screen.getByRole('button', { name: 'Gus the Fern' }));

    expect(push).toHaveBeenCalledWith({ pathname: '/plant/[id]', params: { id: 'plant1' } });
    expect(logAction).toHaveBeenCalledWith('feed_plant_opened', { context: { post_id: 'post1', plant_id: 'plant1' } });
  });

  it("doesn't open a friend's plant, whose page is owner-only", async () => {
    await render(<FeedPlantCard post={post('friends')} />);

    expect(screen.queryByRole('button', { name: 'Gus the Fern' })).toBeNull();
    await user.press(screen.getByText('Gus the Fern'));
    expect(push).not.toHaveBeenCalled();
  });
});
