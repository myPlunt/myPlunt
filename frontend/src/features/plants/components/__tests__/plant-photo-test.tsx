import { act, render, screen } from '@testing-library/react-native';

import { PlantPhoto } from '../plant-photo';

describe('PlantPhoto', () => {
  it('shows the photo when the plant has one', async () => {
    await render(
      <PlantPhoto photoUrl="https://storage.test/vera.jpg" accessibilityLabel="Photo of Vera" className="" iconSize={36} />,
    );

    expect(screen.getByLabelText('Photo of Vera')).toBeOnTheScreen();
  });

  it('shows only the placeholder when the plant has no photo', async () => {
    await render(<PlantPhoto photoUrl={null} accessibilityLabel="Photo of Vera" className="" iconSize={36} />);

    expect(screen.queryByLabelText('Photo of Vera')).toBeNull();
  });

  it('falls back to the placeholder when the photo cannot be loaded', async () => {
    await render(
      <PlantPhoto photoUrl="https://storage.test/gone.jpg" accessibilityLabel="Photo of Vera" className="" iconSize={36} />,
    );

    await act(async () => screen.getByLabelText('Photo of Vera').props.onError({ nativeEvent: { error: 'Not found' } }));

    expect(screen.queryByLabelText('Photo of Vera')).toBeNull();
  });

  it('tries again when the plant gets a new photo', async () => {
    const { rerender } = await render(
      <PlantPhoto photoUrl="https://storage.test/gone.jpg" accessibilityLabel="Photo of Vera" className="" iconSize={36} />,
    );
    await act(async () => screen.getByLabelText('Photo of Vera').props.onError({ nativeEvent: { error: 'Not found' } }));

    await rerender(
      <PlantPhoto photoUrl="https://storage.test/new.jpg" accessibilityLabel="Photo of Vera" className="" iconSize={36} />,
    );

    expect(screen.getByLabelText('Photo of Vera')).toBeOnTheScreen();
  });
});
