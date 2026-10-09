import { render, screen } from '@testing-library/react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Typography } from '@/constants/theme';

describe('ThemedText', () => {
  it('renders its children as body text in the theme text colour', async () => {
    await render(<ThemedText>Hello myPlunt</ThemedText>);

    expect(screen.getByText('Hello myPlunt')).toHaveStyle({
      ...Typography.bodyLarge,
      color: Colors.light.text,
    });
  });

  it('uses the theme colour named by themeColor', async () => {
    await render(<ThemedText themeColor="primary">Register</ThemedText>);

    expect(screen.getByText('Register')).toHaveStyle({ color: Colors.light.primary });
  });

  it('lets a Typography token in style override the default text style', async () => {
    await render(<ThemedText style={Typography.h5}>myPlunt</ThemedText>);

    expect(screen.getByText('myPlunt')).toHaveStyle(Typography.h5);
  });
});
