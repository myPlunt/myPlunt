import { SymbolView } from 'expo-symbols';
import { Pressable, Text } from 'react-native';

import { oneLine } from '@/features/plants/components/notebook-paper';
import { useTheme } from '@/hooks/use-theme';

interface ShareToFeedCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Asks whether a new plant or photo should show up in friends' feed, on one ruled line. */
export function ShareToFeedCheckbox({ checked, onChange }: ShareToFeedCheckboxProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel="Share this with your friends in the main feed"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      className="flex-row items-center gap-2 active:opacity-70"
      style={oneLine}>
      {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
      <SymbolView
        name={
          checked
            ? { ios: 'checkmark.square.fill', android: 'check_box', web: 'check_box' }
            : { ios: 'square', android: 'check_box_outline_blank', web: 'check_box_outline_blank' }
        }
        tintColor={checked ? theme.primary : theme.inputBorder}
        size={20}
      />
      <Text className="type-body-medium shrink text-text" numberOfLines={1} adjustsFontSizeToFit>
        Share this with your friends in the main feed
      </Text>
    </Pressable>
  );
}
