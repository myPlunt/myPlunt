import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface GardenSwitchProps {
  friendName: string;
  showFriend: boolean;
  onChange: (showFriend: boolean) => void;
}

export function GardenSwitch({ friendName, showFriend, onChange }: GardenSwitchProps) {
  const theme = useTheme();

  return (
    <View accessibilityRole="tablist" className="flex-row gap-1 rounded-full bg-background-element p-1">
      <Option label="My garden" selected={!showFriend} onPress={() => onChange(false)} />
      <Option label={`${friendName}'s garden`} selected={showFriend} onPress={() => onChange(true)}>
        <SymbolView
          name={{ ios: 'key.fill', android: 'key', web: 'key' }}
          tintColor={showFriend ? theme.snow : theme.textSecondary}
          size={14}
        />
      </Option>
    </View>
  );
}

function Option({ label, selected, onPress, children }: { label: string; selected: boolean; onPress: () => void; children?: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-full active:opacity-70 ${
        selected ? 'bg-action-primary' : ''
      }`}>
      {children}
      <Text className={`type-button-medium ${selected ? 'text-snow' : 'text-text-secondary'}`} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
