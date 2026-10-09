import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { Shadow } from '@/constants/theme';
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
  { label, error, helperText, helperSuccess, className, ...rest },
  ref,
) {
  const theme = useTheme();

  return (
    <View className="mb-2 gap-1">
      <Text className="type-label text-text-secondary">{label}</Text>
      {/* No Input component exists as of now */}
      <TextInput
        ref={ref}
        className={`type-body-large h-10 rounded-[10px] border-[1.5px] bg-background-element px-4 text-text ${
          error ? 'border-error' : 'border-input-border'
        } ${className ?? ''}`}
        style={Shadow.level2}
        // A colour prop, not a style, so it can't take a class.
        placeholderTextColor={theme.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={label}
        {...rest}
      />
      {error ? (
        <Text className="type-caption text-error">{error}</Text>
      ) : (
        helperText && (
          <Text className={`type-caption ${helperSuccess ? 'text-primary' : 'text-text-secondary'}`}>
            {helperText}
          </Text>
        )
      )}
    </View>
  );
});
