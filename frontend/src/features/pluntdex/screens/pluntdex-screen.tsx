import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Shadow } from '@/constants/theme';
import { useGarden } from '@/features/garden/use-garden';
import { ChoiceChip } from '@/features/plants/components/choice-chip';
import { RegionSelect } from '@/features/pluntdex/components/region-select';
import { SpeciesCard } from '@/features/pluntdex/components/species-card';
import { filterSpecies, regionsOf, type PluntdexFilter } from '@/features/pluntdex/filter';
import { useSpecies } from '@/features/species/use-species';
import { useTheme } from '@/hooks/use-theme';

// Every approved species, numbered like a Pokédex. Species the user owns a plant of
// are "caught"; the rest are shown as unseen entries. The garden reloads on focus, so a
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
  const progress = visible.length === 0 ? 0 : caughtCount / visible.length;
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
          contentContainerClassName="w-full max-w-content grow gap-4 self-center px-6 pb-8 pt-2">
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
              {/* Shadow goes through style so it sets both iOS shadow* and Android elevation. */}
              <View className="gap-3 rounded-3xl bg-action-primary p-5" style={Shadow.card}>
                <View className="flex-row items-center justify-between">
                  <View className="shrink">
                    <Text className="type-label text-background-element/70">PLUNTDEX</Text>
                    <Text accessibilityRole="header" className="type-h4 text-background-element" style={styles.count}>
                      {caughtCount} / {visible.length} discovered
                    </Text>
                  </View>
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-background-element/15">
                    {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
                    <SymbolView
                      name={{ ios: 'book.fill', android: 'menu_book', web: 'menu_book' }}
                      tintColor={theme.backgroundElement}
                      size={26}
                    />
                  </View>
                </View>
                <View
                  accessibilityRole="progressbar"
                  accessibilityValue={{ min: 0, max: visible.length, now: caughtCount }}
                  className="h-2.5 overflow-hidden rounded-full bg-background-element/20">
                  {/* The width is a runtime fraction, so it can't be a class. */}
                  <View className="h-full rounded-full bg-background-element" style={{ width: `${progress * 100}%` }} />
                </View>
                <Text className="type-caption text-background-element/80">
                  {caughtCount === visible.length && visible.length > 0
                    ? 'Every one caught. Nice gardening!'
                    : 'Add a plant to your garden to catch its species.'}
                </Text>
              </View>

              <View className="h-11 flex-row items-center gap-2 rounded-full border-[1.5px] border-input-border bg-background-element px-4">
                <SymbolView
                  name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                  tintColor={theme.textSecondary}
                  size={16}
                />
                <TextInput
                  accessibilityLabel="Search species"
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Name or scientific name"
                  // A colour prop, not a style, so it can't take a class.
                  placeholderTextColor={theme.placeholder}
                  autoCorrect={false}
                  returnKeyType="search"
                  className="type-body-large flex-1 text-text"
                />
                {query !== '' && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                    onPress={() => setQuery('')}
                    hitSlop={8}
                    className="active:opacity-70">
                    <SymbolView
                      name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                      tintColor={theme.textSecondary}
                      size={18}
                    />
                  </Pressable>
                )}
              </View>

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

              {visible.length === 0 ? (
                <View className="items-center gap-2 rounded-3xl border-[1.5px] border-dashed border-input-border p-8">
                  <SymbolView name={{ ios: 'leaf', android: 'eco', web: 'eco' }} tintColor={theme.accentMuted} size={32} />
                  <Text className="type-subtitle-large text-text">No species match</Text>
                  <Text className="type-body-medium text-center text-text-secondary">
                    Try another name or clear a filter.
                  </Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap justify-between gap-y-4">
                  {visible.map((s) => (
                    <SpeciesCard
                      key={s.id}
                      species={s}
                      // Numbered by place in the full list, so a species keeps its number while filtering.
                      number={String(species.indexOf(s) + 1).padStart(3, '0')}
                      caught={caught.has(s.id)}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Lateef's natural line is ~1.45× its size; type-h4's 40 clips the bottom of the glyphs
  // on iOS, and Android's extra font padding is dropped so both platforms match. A style,
  // because a leading-* class loses to type-h4.
  count: {
    lineHeight: 46,
    includeFontPadding: false,
  },
});
