import { render, screen } from '@testing-library/react-native';

import { Colors } from '@/constants/theme';

import { ThemedView } from '../themed-view';

describe('ThemedView', () => {
  it('uses the theme background by default', async () => {
    await render(<ThemedView testID="view" />);

    expect(screen.getByTestId('view')).toHaveStyle({ backgroundColor: Colors.light.background });
  });

  it('uses the theme colour named by type', async () => {
    await render(<ThemedView testID="view" type="backgroundElement" />);

    expect(screen.getByTestId('view')).toHaveStyle({ backgroundColor: Colors.light.backgroundElement });
  });

  it('lets a passed style override the theme background', async () => {
    await render(<ThemedView testID="view" style={{ backgroundColor: 'transparent' }} />);

    expect(screen.getByTestId('view')).toHaveStyle({ backgroundColor: 'transparent' });
  });
});
