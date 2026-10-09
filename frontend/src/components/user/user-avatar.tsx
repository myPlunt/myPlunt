import { SymbolView } from 'expo-symbols';
import { View } from 'react-native';

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
      className="items-center justify-center overflow-hidden border-[1.5px] border-primary bg-background-selected"
      // Size is a prop, so it can't be a static class.
      style={{ width: size, height: size, borderRadius: size / 2 }}>
      <SymbolView
        name={{ ios: 'person.fill', android: 'person', web: 'person' }}
        tintColor={theme.actionPrimary}
        size={size * 0.55}
      />
    </View>
  );
}
