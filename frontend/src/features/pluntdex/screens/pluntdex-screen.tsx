import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Shadow } from '@/constants/theme';
import { useGarden } from '@/features/garden/use-garden';
import { ChoiceChip } from '@/features/plants/components/choice-chip';
import { PlantPhoto } from '@/features/plants/components/plant-photo';
import { RegionSelect } from '@/features/pluntdex/components/region-select';
import { filterSpecies, regionsOf, type PluntdexFilter } from '@/features/pluntdex/filter';
import { useSpecies } from '@/features/species/use-species';
import { useTheme } from '@/hooks/use-theme';

// Every approved species, numbered like a Pokédex. Species the user owns a plant of
// are "caught"; the rest are shown greyed out. The garden reloads on focus, so a
// plant added from the tab bar counts as soon as the user comes back here.
export function PluntdexScreen() {
  const theme = useTheme();
  const { species, error: speciesError } = useSpecies();
  const { garden, error: gardenError, isLoading, retry } = useGarden();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PluntdexFilter>({ only: null, region: null });

  const caught = new Set(
    garden?.rooms.flatMap((room) => room.plants.flatMap((plant) => (plant.speciesId ? [plant.speciesId] : []))),
  );
  const visible = species ? filterSpecies(species, caught, query, filter) : [];
  // Counts what's on screen, so searching "basil" reads 1 / 1 instead of out of every species.
  const caughtCount = visible.filter((s) => caught.has(s.id)).length;
  const error = speciesError ?? gardenError;
  // Tapping the picked chip again clears it (ChoiceChip shows a ✕).
  const toggle = (only: 'common' | 'caught') =>
    setFilter((current) => ({ ...current, only: current.only === only ? null : only }));

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <AppHeader />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="w-full max-w-content grow gap-3 self-center px-6 pb-8 pt-2">
          {error ? (
            <View className="items-center gap-3">
              <Text className="type-body-medium text-error">{error}</Text>
              {/* The species list loads once, so only a garden error can be retried. */}
              {gardenError && <Button label="Try again" variant="secondary" onPress={retry} />}
            </View>
          ) : isLoading || !species ? (
            <ActivityIndicator accessibilityLabel="Loading Pluntdex" color={theme.primary} className="mt-6" />
          ) : (
            <>
              <FormField
                label="Search species"
                value={query}
                onChangeText={setQuery}
                placeholder="Name or scientific name"
                autoCorrect={false}
                returnKeyType="search"
              />

              <View className="flex-row gap-2">
                <View accessibilityRole="radiogroup" className="flex-row gap-2">
                  <ChoiceChip
                    label="Common"
                    icon={{ ios: 'leaf.fill', android: 'eco', web: 'eco' }}
                    selected={filter.only === 'common'}
                    onPress={() => toggle('common')}
                  />
                  <ChoiceChip
                    label="Caught"
                    icon={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
                    selected={filter.only === 'caught'}
                    onPress={() => toggle('caught')}
                  />
                </View>
                <RegionSelect
                  regions={regionsOf(species)}
                  selected={filter.region}
                  onSelect={(region) => setFilter((current) => ({ ...current, region }))}
                />
              </View>

              <Text className="type-body-large text-text-secondary">
                {caughtCount} / {visible.length} discovered
              </Text>

              {visible.length === 0 && (
                <Text className="type-body-medium text-text-secondary">No species match.</Text>
              )}
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {visible.map((s) => {
                  const isCaught = caught.has(s.id);
                  // Numbered by place in the full list, so a species keeps its number while filtering.
                  const number = String(species.indexOf(s) + 1).padStart(3, '0');
                  return (
                    <View
                      key={s.id}
                      accessible
                      accessibilityLabel={`${s.commonName}, ${isCaught ? 'caught' : 'not caught yet'}`}
                      className={`w-[48%] rounded-3xl bg-background-element p-2 ${isCaught ? '' : 'opacity-40'}`}
                      style={Shadow.card}>
                      <PlantPhoto
                        photoUrl={s.imageUrl}
                        accessibilityLabel={`Picture of ${s.commonName}`}
                        className="aspect-square w-full rounded-2xl"
                        iconSize={36}
                      />
                      <View className="px-2 pb-2 pt-3">
                        <View className="flex-row items-center justify-between">
                          <Text className="type-label text-text-secondary">#{number}</Text>
                          {isCaught && (
                            <SymbolView
                              name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
                              tintColor={theme.primary}
                              size={18}
                            />
                          )}
                        </View>
                        <Text className="type-subtitle-large text-text" numberOfLines={1}>
                          {s.commonName}
                        </Text>
                        <Text className="type-body-medium italic text-text-secondary" numberOfLines={1}>
                          {s.scientificName}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
