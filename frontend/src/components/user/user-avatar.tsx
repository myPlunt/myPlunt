import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface UserAvatarProps {
  size?: number;
  /** The profile picture (remote link or local file); null or missing shows the person bubble. */
  url?: string | null;
  /** Read out for the picture, e.g. "jane's profile picture"; the bubble is decoration. */
  accessibilityLabel?: string;
}

// The user's profile picture, or a generic person bubble when they have none. The bubble
// also shows when the picture can't be loaded (offline, expired link, file gone).
export function UserAvatar({ size = 40, url = null, accessibilityLabel }: UserAvatarProps) {
  const theme = useTheme();
  // The URL that failed, so a new URL (e.g. a newly picked picture) gets its own try.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = url !== null && url !== failedUrl;

  return (
    <View
      testID="user-avatar"
      className="items-center justify-center overflow-hidden border-[1.5px] border-primary bg-background-element"
      // Size is a prop, so it can't be a static class.
      style={{ width: size, height: size, borderRadius: size / 2 }}>
      <SymbolView
        name={{ ios: 'person.fill', android: 'person', web: 'person' }}
        tintColor={theme.actionPrimary}
        size={size * 0.55}
      />
      {showPhoto && (
        <Image
          accessibilityLabel={accessibilityLabel}
          source={{ uri: url }}
          className="absolute inset-0"
          contentFit="cover"
          onError={() => setFailedUrl(url)}
        />
      )}
    </View>
  );
}
