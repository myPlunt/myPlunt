import { fireEvent, render, screen } from '@testing-library/react-native';

import { FormField } from '../form-field';

describe('FormField', () => {
  it('renders the label and the current value', async () => {
    await render(<FormField label="Email" value="jane@example.com" onChangeText={jest.fn()} />);

    expect(screen.getByText('Email')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('jane@example.com')).toBeOnTheScreen();
  });

  it('calls onChangeText as the user types', async () => {
    const onChangeText = jest.fn();
    await render(<FormField label="Email" value="" onChangeText={onChangeText} />);

    fireEvent.changeText(screen.getByDisplayValue(''), 'jane@example.com');

    expect(onChangeText).toHaveBeenCalledWith('jane@example.com');
  });
});
