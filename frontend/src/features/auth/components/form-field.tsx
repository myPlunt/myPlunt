import { forwardRef } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { brand, Shadow, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  /** Persistent hint shown below the field (e.g. password rules). Hidden while `error` is set. */
  helperText?: string;
  /** Colors `helperText` green instead of muted grey, e.g. once a rule is satisfied. */
  helperSuccess?: boolean;
}

export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
  { label, error, helperText, helperSuccess, style, ...rest },
  ref,
) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={[Typography.label, { color: theme.textSecondary }]}>{label}</ThemedText>
      {/* No Input component exists as of now */}
      <TextInput
        ref={ref}
        style={[
          styles.input,
          Shadow.level2,
          Typography.bodyLarge,
          {
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: error ? theme.error : brand.oliveWood300,
          },
          style,
        ]}
        placeholderTextColor={brand.grey500}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={label}
        {...rest}
      />
      {error ? (
        <ThemedText style={Typography.caption} themeColor="error">
          {error}
        </ThemedText>
      ) : (
        helperText && (
          <ThemedText
            style={[Typography.caption, { color: helperSuccess ? brand.fern500 : theme.textSecondary }]}>
            {helperText}
          </ThemedText>
        )
      )}
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
    height: 40,
  },
});
