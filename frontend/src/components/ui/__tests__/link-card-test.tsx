import { render, screen, userEvent } from '@testing-library/react-native';

import { LinkCard } from '../link-card';

const user = userEvent.setup();

describe('LinkCard', () => {
  it('opens on press', async () => {
    const onPress = jest.fn();
    await render(
      <LinkCard
        title="Watering history"
        icon={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
        onPress={onPress}
      />,
    );

    await user.press(screen.getByRole('button', { name: 'Watering history' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
