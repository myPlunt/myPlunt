import { render, screen, userEvent } from '@testing-library/react-native';

import { AppHeader } from '../app-header';

const user = userEvent.setup();

describe('AppHeader', () => {
  it('calls onBrandPress when the logo and name are pressed', async () => {
    const onBrandPress = jest.fn();
    await render(<AppHeader onBrandPress={onBrandPress} />);

    await user.press(screen.getByRole('button', { name: 'Go to feed' }));

    expect(onBrandPress).toHaveBeenCalled();
  });

  it('shows the brand as plain content when there is no onBrandPress', async () => {
    await render(<AppHeader />);

    expect(screen.getByText('myPlunt')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Go to feed' })).toBeNull();
  });
});
