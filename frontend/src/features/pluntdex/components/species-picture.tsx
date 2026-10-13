import { StyleSheet, Text, View } from 'react-native';

import { PlantPhoto } from '@/features/plants/components/plant-photo';
import type { Species } from '@/lib/species/types';

interface SpeciesPictureProps {
  species: Species;
  discovered: boolean;
  /** Size and shape, e.g. "aspect-square w-full rounded-2xl". */
  className: string;
  iconSize: number;
}

/**
 * A species' picture: sharp once discovered; until then blurred behind a "?", like an unseen
 * Pokédex entry. Shared by the Pluntdex cards and a species' own page.
 */
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
  // Lateef's natural line is ~1.45× its size; type-h2's shorter line height clips the
  // glyph on iOS, so the "?" gets its full height and no Android font padding. A style,
  // because a leading-* class loses to type-h2.
  mystery: {
    lineHeight: 70,
    includeFontPadding: false,
  },
});
