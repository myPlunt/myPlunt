import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface ChoiceChipProps {
  label: string;
  icon: SymbolViewProps['name'];
  selected: boolean;
  onPress: () => void;
}

/**
 * One option in a single-choice group (the parent sets accessibilityRole="radiogroup").
 * The chosen one shows a ✕: tapping it again clears the choice.
 * h-8 (28px with NativeWind's 14px rem) leaves room above and below inside one ruled line.
 */
export function ChoiceChip({ label, icon, selected, onPress }: ChoiceChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      accessibilityHint={selected ? 'Tap again to clear' : undefined}
      onPress={onPress}
      className={`h-8 flex-row items-center gap-2 rounded-full border-[1.5px] px-3 active:opacity-70 ${
        selected ? 'border-primary bg-primary' : 'border-input-border bg-background-element'
      }`}>
      {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
      <SymbolView name={icon} tintColor={selected ? theme.backgroundElement : theme.accent} size={16} />
      <Text className={`type-body-medium ${selected ? 'text-background-element' : 'text-text'}`}>{label}</Text>
      {/* Tapping the chosen option again clears it; the ✕ makes that visible. */}
      {selected && (
        <SymbolView
          name={{ ios: 'xmark', android: 'close', web: 'close' }}
          tintColor={theme.backgroundElement}
          size={12}
        />
      )}
    </Pressable>
  );
}
