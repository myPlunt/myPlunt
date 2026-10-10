import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, Text } from 'react-native';

import { Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ChoiceChipProps {
  label: string;
  icon: SymbolViewProps['name'];
  selected: boolean;
  onPress: () => void;
}

/** One option in a single-choice group (the parent sets accessibilityRole="radiogroup"). */
export function ChoiceChip({ label, icon, selected, onPress }: ChoiceChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={`flex-row items-center gap-2 rounded-full border-[1.5px] px-3 py-2 active:opacity-70 ${
        selected ? 'border-primary bg-primary' : 'border-input-border bg-background-element'
      }`}
      style={Shadow.level2}>
      {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
      <SymbolView name={icon} tintColor={selected ? theme.backgroundElement : theme.accent} size={16} />
      <Text className={`type-body-medium ${selected ? 'text-background-element' : 'text-text'}`}>{label}</Text>
    </Pressable>
  );
}
