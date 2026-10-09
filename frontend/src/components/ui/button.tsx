import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

import { Shadow, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type ButtonSize = 'medium' | 'large';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

// `spinner` is a theme key because ActivityIndicator takes a colour prop, not a class.
const variantClasses: Record<ButtonVariant, { container: string; text: string; spinner: ThemeColor }> = {
  primary: { container: 'bg-action-primary', text: 'text-background-element', spinner: 'backgroundElement' },
  secondary: { container: 'bg-background border border-border', text: 'text-text', spinner: 'text' },
  destructive: { container: 'bg-error', text: 'text-background-element', spinner: 'backgroundElement' },
  ghost: { container: 'bg-transparent', text: 'text-primary', spinner: 'primary' },
};

const sizeClasses: Record<ButtonSize, { container: string; text: string }> = {
  medium: { container: 'h-10 px-5 rounded-[10px]', text: 'type-button-medium' },
  large: { container: 'h-12 px-6 rounded-xl', text: 'type-button-large' },
};

export function Button({ label, variant = 'primary', size = 'medium', loading, disabled, ...rest }: ButtonProps) {
  const theme = useTheme();
  const colors = variantClasses[variant];
  const dimensions = sizeClasses[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`items-center justify-center active:opacity-80 ${colors.container} ${dimensions.container} ${
        isDisabled ? 'opacity-50' : ''
      }`}
      style={variant !== 'ghost' ? Shadow.level2 : undefined}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={theme[colors.spinner]} />
      ) : (
        <Text className={`${dimensions.text} ${colors.text}`}>{label}</Text>
      )}
    </Pressable>
  );
}
