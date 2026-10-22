import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface PlantPhotoProps {
  photoUrl: string | null;
  accessibilityLabel: string;
  className: string;
  iconSize: number;
  blurRadius?: number;
}

export function PlantPhoto({ photoUrl, accessibilityLabel, className, iconSize, blurRadius }: PlantPhotoProps) {
  const theme = useTheme();
  // The URL that failed, so a new URL (e.g. after editing the photo) gets its own try.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = photoUrl !== null && photoUrl !== failedUrl;

  return (
    <View className={`items-center justify-center overflow-hidden bg-primary ${className}`}>
      <SymbolView name={{ ios: 'leaf', android: 'eco', web: 'eco' }} tintColor={theme.backgroundElement} size={iconSize} />
      {showPhoto && (
        <Image
          accessibilityLabel={accessibilityLabel}
          // The presigned link changes on every load but the file never does, so the link without its query is
          // the cache key: a photo seen once shows offline.
          source={{ uri: photoUrl, cacheKey: photoUrl.split('?')[0] }}
          className="absolute inset-0"
          contentFit="cover"
          blurRadius={blurRadius}
          onError={() => setFailedUrl(photoUrl)}
        />
      )}
    </View>
  );
}
