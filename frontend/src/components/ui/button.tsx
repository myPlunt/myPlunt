import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { Shadow, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type ButtonSize = 'medium' | 'large';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number; radius: number }> = {
  medium: { height: 40, paddingHorizontal: Spacing.three + Spacing.one, radius: 10 },
  large: { height: 48, paddingHorizontal: Spacing.four, radius: 12 },
};

export function Button({ label, variant = 'primary', size = 'medium', loading, disabled, ...rest }: ButtonProps) {
  const theme = useTheme();
  const variantStyles: Record<ButtonVariant, { background: string; border?: string; text: string }> = {
    primary: { background: theme.actionPrimary, text: theme.backgroundElement },
    secondary: { background: theme.background, border: theme.border, text: theme.text },
    destructive: { background: theme.error, text: theme.backgroundElement },
    ghost: { background: 'transparent', text: theme.primary },
  };
  const colors = variantStyles[variant];
  const dimensions = sizeStyles[size];
  const typography = size === 'large' ? Typography.buttonLarge : Typography.buttonMedium;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={[
        styles.base,
        variant !== 'ghost' && Shadow.level2,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderWidth: colors.border ? 1 : 0,
          height: dimensions.height,
          paddingHorizontal: dimensions.paddingHorizontal,
          borderRadius: dimensions.radius,
          opacity: isDisabled ? 0.5 : 1,
        },
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={[typography, { color: colors.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
