import { SymbolView } from 'expo-symbols';
import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function CommentCount({ count }: { count: number }) {
  const theme = useTheme();

  return (
    // The card it sits on reads the count out (countsLabel), so screen readers skip this.
    <View
      className="flex-row items-center gap-1"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <SymbolView
        name={{ ios: 'bubble.left', android: 'chat_bubble', web: 'chat_bubble' }}
        tintColor={theme.textSecondary}
        size={14}
      />
      <Text className="type-caption text-text-secondary">{count}</Text>
    </View>
  );
}
