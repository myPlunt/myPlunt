import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface UserAvatarProps {
  size?: number;
}

// Generic person bubble. Swap in the user's photo/initials once the profile
// endpoint exists.
export function UserAvatar({ size = 40 }: UserAvatarProps) {
  const theme = useTheme();

  return (
    <View
      testID="user-avatar"
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.backgroundSelected,
          borderColor: theme.primary,
        },
      ]}>
      <SymbolView
        name={{ ios: 'person.fill', android: 'person', web: 'person' }}
        tintColor={theme.actionPrimary}
        size={size * 0.55}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
});
