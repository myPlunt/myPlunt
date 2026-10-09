import { render, screen } from '@testing-library/react-native';

import { FeedScreen } from '../feed-screen';

describe('FeedScreen', () => {
  it('shows the empty state while there are no posts', async () => {
    await render(<FeedScreen />);

    expect(screen.getByText('Your feed is empty')).toBeOnTheScreen();
  });
});
