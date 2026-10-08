import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function FormField({ label, style, ...rest }: TextInputProps & { label: string }) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={[Typography.label, { color: theme.textSecondary }]}>{label}</ThemedText>
      {/* No Input component exists as of now */}
      <TextInput
        style={[
          styles.input,
          Typography.bodyLarge,
          { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
          style,
        ]}
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={label}
        {...rest}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    height: 40,
  },
});
