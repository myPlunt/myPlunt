import { act, render, screen } from '@testing-library/react-native';

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

  it('shows the picture when there is one', async () => {
    await render(<UserAvatar url="https://storage.test/jane.jpg" accessibilityLabel="jane's profile picture" />);

    expect(screen.getByLabelText("jane's profile picture")).toBeOnTheScreen();
  });

  it('falls back to the person bubble when the picture fails to load', async () => {
    await render(<UserAvatar url="https://storage.test/gone.jpg" accessibilityLabel="jane's profile picture" />);

    await act(async () =>
      screen.getByLabelText("jane's profile picture").props.onError({ nativeEvent: { error: 'Not found' } }),
    );

    expect(screen.queryByLabelText("jane's profile picture")).toBeNull();
  });
});
