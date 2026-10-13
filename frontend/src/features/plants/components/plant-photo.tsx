import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface PlantPhotoProps {
  /** The plant's photo; null when it has none. */
  photoUrl: string | null;
  /** Read out for the photo; the placeholder is decoration. */
  accessibilityLabel: string;
  /** Size and shape of the box (e.g. "h-[120px] rounded-2xl"). */
  className: string;
  iconSize: number;
  /** Blurs the photo (the Pluntdex hides species the user hasn't discovered yet). */
  blurRadius?: number;
}

/**
 * The plant's photo, or a leaf placeholder when it has none. The placeholder is also what
 * shows when the photo can't be loaded (no connection, an expired link, a file that's gone
 * from storage), instead of an empty box.
 */
export function PlantPhoto({ photoUrl, accessibilityLabel, className, iconSize, blurRadius }: PlantPhotoProps) {
  const theme = useTheme();
  // The URL that failed, so a new URL (e.g. after editing the photo) gets its own try.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = photoUrl !== null && photoUrl !== failedUrl;

  return (
    <View className={`items-center justify-center overflow-hidden bg-primary ${className}`}>
      {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
      <SymbolView name={{ ios: 'leaf', android: 'eco', web: 'eco' }} tintColor={theme.backgroundElement} size={iconSize} />
      {showPhoto && (
        <Image
          accessibilityLabel={accessibilityLabel}
          source={{ uri: photoUrl }}
          className="absolute inset-0"
          contentFit="cover"
          blurRadius={blurRadius}
          onError={() => setFailedUrl(photoUrl)}
        />
      )}
    </View>
  );
}
