import { render, screen } from '@testing-library/react-native';

import { UserAvatar } from '../user-avatar';

describe('UserAvatar', () => {
  it('renders a 40px circle by default', async () => {
    await render(<UserAvatar />);

    expect(screen.getByTestId('user-avatar')).toHaveStyle({ width: 40, height: 40, borderRadius: 20 });
  });

  it('scales the circle to the given size', async () => {
    await render(<UserAvatar size={96} />);

    expect(screen.getByTestId('user-avatar')).toHaveStyle({ width: 96, height: 96, borderRadius: 48 });
  });
});
