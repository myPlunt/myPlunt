import { SymbolView } from 'expo-symbols';
import { Pressable, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  /** Read out for the field, e.g. "Search people". */
  accessibilityLabel: string;
  placeholder: string;
  autoCapitalize?: 'none' | 'words';
}

/** A rounded search box with a magnifier, and a ✕ that clears it once something is typed. */
export function SearchField({
  value,
  onChangeText,
  accessibilityLabel,
  placeholder,
  autoCapitalize,
}: SearchFieldProps) {
  const theme = useTheme();

  return (
    <View className="h-11 flex-row items-center gap-2 rounded-full border-[1.5px] border-input-border bg-background-element px-4">
      {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
      <SymbolView
        name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
        tintColor={theme.textSecondary}
        size={16}
      />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        // A colour prop, not a style, so it can't take a class.
        placeholderTextColor={theme.placeholder}
        autoCorrect={false}
        autoCapitalize={autoCapitalize}
        returnKeyType="search"
        className="type-body-large flex-1 text-text"
      />
      {value !== '' && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChangeText('')}
          hitSlop={8}
          className="active:opacity-70">
          <SymbolView
            name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
            tintColor={theme.textSecondary}
            size={18}
          />
        </Pressable>
      )}
    </View>
  );
}
