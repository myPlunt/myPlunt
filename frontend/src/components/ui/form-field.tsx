import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { Shadow, singleLineInputText } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
  helperSuccess?: boolean;
}

export const FormField = forwardRef<TextInputInstance, FormFieldProps>(function FormField(
  { label, error, helperText, helperSuccess, className, multiline, ...rest },
  ref,
) {
  const theme = useTheme();

  return (
    <View className="mb-2 gap-1">
      <Text className="type-label text-text-secondary">{label}</Text>
      <TextInput
        ref={ref}
        className={`rounded-[10px] border-[1.5px] bg-background-element px-4 text-text ${
          multiline ? 'type-body-large min-h-24 py-2' : 'h-10'
        } ${error ? 'border-error' : 'border-input-border'} ${className ?? ''}`}
        // Android centres multiline text vertically by default; iOS starts at the top.
        style={[Shadow.level2, multiline ? { textAlignVertical: 'top' } : singleLineInputText]}
        multiline={multiline}
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
