import { render, screen, userEvent } from '@testing-library/react-native';

import { Button } from '../button';

const user = userEvent.setup();

describe('Button', () => {
  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} />);

    await user.press(screen.getByRole('button', { name: 'Save' }));

    expect(onPress).toHaveBeenCalled();
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} disabled />);

    await user.press(screen.getByRole('button', { name: 'Save' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('hides the label and disables itself while loading', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} loading />);

    expect(screen.queryByText('Save')).toBeNull();
    await user.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
