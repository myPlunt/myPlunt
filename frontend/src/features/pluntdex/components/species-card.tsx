import { SymbolView } from 'expo-symbols';
import { Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { SpeciesPicture } from '@/features/pluntdex/components/species-picture';
import { useTheme } from '@/hooks/use-theme';
import type { Species } from '@/lib/species/types';

interface SpeciesCardProps {
  species: Species;
  number: string;
  discovered: boolean;
  onPress: () => void;
}

export function SpeciesCard({ species, number, discovered, onPress }: SpeciesCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${species.commonName}, ${discovered ? 'discovered' : 'not discovered yet'}`}
      onPress={onPress}
      className={`w-[48%] rounded-3xl p-2 active:opacity-70 ${
        discovered ? 'bg-background-element' : 'border-[1.5px] border-dashed border-input-border'
      }`}
      style={discovered ? Shadow.card : undefined}>
      <View>
        <SpeciesPicture species={species} discovered={discovered} className="aspect-square w-full rounded-2xl" iconSize={36} />

        <View className="absolute left-2 top-2 rounded-full bg-background-element/90 px-2 py-0.5">
          <Text className="type-label text-accent">#{number}</Text>
        </View>
        {discovered && (
          <View className="absolute right-2 top-2 h-7 w-7 items-center justify-center rounded-full bg-primary">
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
          <Text className={`type-subtitle-large ${discovered ? 'text-text' : 'text-text-secondary'}`} numberOfLines={1}>
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
    </Pressable>
  );
}

