import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { PlantPhoto } from '@/features/plants/components/plant-photo';
import { useTheme } from '@/hooks/use-theme';
import type { Species } from '@/lib/species/types';

interface SpeciesCardProps {
  species: Species;
  /** Its place in the full Pluntdex, e.g. "001". */
  number: string;
  caught: boolean;
}

/**
 * One Pluntdex entry. A caught species is a raised card with its picture and a seal; one not
 * caught yet is a dashed outline with its picture blurred behind a "?", like an unseen Pokédex entry.
 */
export function SpeciesCard({ species, number, caught }: SpeciesCardProps) {
  const theme = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={`${species.commonName}, ${caught ? 'caught' : 'not caught yet'}`}
      className={`w-[48%] rounded-3xl p-2 ${
        caught ? 'bg-background-element' : 'border-[1.5px] border-dashed border-input-border'
      }`}
      // Shadow goes through style so it sets both iOS shadow* and Android elevation.
      style={caught ? Shadow.card : undefined}>
      <View>
        {caught ? (
          <PlantPhoto
            photoUrl={species.imageUrl}
            accessibilityLabel={`Picture of ${species.commonName}`}
            className="aspect-square w-full rounded-2xl"
            iconSize={36}
          />
        ) : (
          <View className="aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-border/40">
            {species.imageUrl && (
              <PlantPhoto
                photoUrl={species.imageUrl}
                accessibilityLabel={`Picture of ${species.commonName}`}
                className="absolute inset-0 opacity-50"
                iconSize={36}
                blurRadius={24}
              />
            )}
            <Text className="type-h2 text-accent-muted" style={styles.mystery}>
              ?
            </Text>
          </View>
        )}

        <View className="absolute left-2 top-2 rounded-full bg-background-element/90 px-2 py-0.5">
          <Text className="type-label text-accent">#{number}</Text>
        </View>
        {caught && (
          <View className="absolute right-2 top-2 h-7 w-7 items-center justify-center rounded-full bg-primary">
            {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              tintColor={theme.backgroundElement}
              size={14}
            />
          </View>
        )}
      </View>

      <View className="gap-1 px-1.5 pb-1.5 pt-3">
        <View>
          <Text className={`type-subtitle-large ${caught ? 'text-text' : 'text-text-secondary'}`} numberOfLines={1}>
            {species.commonName}
          </Text>
          <Text className="type-caption italic text-text-secondary" numberOfLines={1}>
            {species.scientificName}
          </Text>
        </View>
        {species.region && (
          <View className="mt-1 flex-row items-center gap-1 self-start rounded-full bg-accent/15 px-2 py-0.5">
            <SymbolView
              name={{ ios: 'globe.europe.africa.fill', android: 'public', web: 'public' }}
              tintColor={theme.accent}
              size={10}
            />
            <Text className="type-caption shrink text-accent" numberOfLines={1}>
              {species.region}
            </Text>
          </View>
        )}
      </View>
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
