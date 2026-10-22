import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface LinkCardProps {
  title: string;
  icon: SymbolViewProps['name'];
  onPress: () => void;
}

export function LinkCard({ title, icon, onPress }: LinkCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border-[1.5px] border-input-border bg-background-element px-4 py-3 active:opacity-70"
      style={Shadow.card}>
      <View className="h-8 w-8 items-center justify-center rounded-full bg-water/15">
        <SymbolView name={icon} tintColor={theme.water} size={16} />
      </View>
      <Text className="type-body-large flex-1 text-text-secondary" numberOfLines={1}>
        {title}
      </Text>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        tintColor={theme.textSecondary}
        size={16}
      />
    </Pressable>
  );
}
