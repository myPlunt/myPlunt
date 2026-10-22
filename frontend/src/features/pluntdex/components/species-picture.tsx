import { StyleSheet, Text, View } from 'react-native';

import { PlantPhoto } from '@/features/plants/components/plant-photo';
import type { Species } from '@/lib/species/types';

interface SpeciesPictureProps {
  species: Species;
  discovered: boolean;
  className: string;
  iconSize: number;
}

export function SpeciesPicture({ species, discovered, className, iconSize }: SpeciesPictureProps) {
  if (discovered) {
    return (
      <PlantPhoto
        photoUrl={species.imageUrl}
        accessibilityLabel={`Picture of ${species.commonName}`}
        className={className}
        iconSize={iconSize}
      />
    );
  }

  return (
    <View className={`items-center justify-center overflow-hidden bg-border/40 ${className}`}>
      {species.imageUrl && (
        <PlantPhoto
          photoUrl={species.imageUrl}
          accessibilityLabel={`Picture of ${species.commonName}`}
          className="absolute inset-0 opacity-50"
          iconSize={iconSize}
          blurRadius={24}
        />
      )}
      <Text className="type-h2 text-accent-muted" style={styles.mystery}>
        ?
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Lateef needs a taller line than type-h2's or iOS clips the "?". A style, as leading-* loses to type-h2.
  mystery: {
    lineHeight: 70,
    includeFontPadding: false,
  },
});
