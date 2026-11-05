import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { SearchField } from '@/components/ui/search-field';
import { Shadow } from '@/constants/theme';
import { OnboardingCard } from '@/features/onboarding/components/onboarding-card';
import { useTourBackLock } from '@/features/onboarding/use-tour-back-lock';
import { ChoiceChip } from '@/features/plants/components/choice-chip';
import { RegionSelect } from '@/features/pluntdex/components/region-select';
import { SpeciesCard } from '@/features/pluntdex/components/species-card';
import { filterSpecies, regionsOf, type PluntdexFilter } from '@/features/pluntdex/filter';
import { useDiscoveredSpecies } from '@/features/species/use-discovered-species';
import { useSpecies } from '@/features/species/use-species';
import { useTheme } from '@/hooks/use-theme';
import type { Species } from '@/lib/species/types';
import { useOnboardingStore } from '@/stores/onboarding-store';

const NO_FILTER: PluntdexFilter = { only: null, region: null };

export function PluntdexScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { species, error: speciesError, retry: retrySpecies } = useSpecies();
  const { discovered: discoveredList, error: discoveredError, isLoading, retry: retryDiscovered } = useDiscoveredSpecies();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PluntdexFilter>(NO_FILTER);
  // During the tour's last step the cards don't open: a species' page would leave the step.
  const { step, next } = useOnboardingStore();
  const isPluntdexStep = step === 'pluntdex';
  useTourBackLock(isPluntdexStep);

  const discovered = new Set(discoveredList?.map((c) => c.speciesId));
  const visible = species ? filterSpecies(species, discovered, query, filter) : [];
  // Numbered by place in the full list, so a species keeps its number while filtering.
  const numbers = new Map(species?.map((s, i) => [s.id, String(i + 1).padStart(3, '0')]));
  // Always out of every species, so the progress doesn't move while searching or filtering.
  const total = species?.length ?? 0;
  const discoveredCount = species?.filter((s) => discovered.has(s.id)).length ?? 0;
  const progress = total === 0 ? 0 : discoveredCount / total;
  const error = speciesError ?? discoveredError;
  function retry() {
    if (speciesError) retrySpecies();
    if (discoveredError) retryDiscovered();
  }
  const toggle = (only: 'common' | 'discovered') =>
    setFilter((current) => ({ ...current, only: current.only === only ? null : only }));
  const clearAll = () => {
    setQuery('');
    setFilter(NO_FILTER);
  };

  // The filters are a row of the list so they can stick to the top; two cards per row keeps them
  // virtualised without numColumns.
  const rows: ('filters' | Species[])[] = ['filters'];
  for (let i = 0; i < visible.length; i += 2) rows.push(visible.slice(i, i + 2));

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <AppHeader />

        {error ? (
          <View className="items-center gap-3 px-6 pt-2">
            <Text className="type-body-medium text-error">{error}</Text>
            <Button label="Try again" variant="secondary" onPress={retry} />
          </View>
        ) : isLoading || !species ? (
          <ActivityIndicator accessibilityLabel="Loading PluntDex" color={theme.primary} className="mt-6" />
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(row) => (row === 'filters' ? row : row[0].id)}
            // Index 0 is the progress card (the list header), so 1 is the filters row.
            stickyHeaderIndices={[1]}
            keyboardShouldPersistTaps="handled"
            // Room to scroll the cards out from under the tour card.
            contentContainerClassName={`w-full max-w-content grow gap-4 self-center px-6 pt-2 ${isPluntdexStep ? 'pb-72' : 'pb-8'}`}
            ListHeaderComponent={
              <View className="gap-3 rounded-3xl bg-action-primary p-5" style={Shadow.card}>
                <View className="flex-row items-center justify-between">
                  <View className="shrink">
                    <Text className="type-label text-background-element/70">PLUNTDEX</Text>
                    <Text accessibilityRole="header" className="type-h4 text-background-element" style={styles.count}>
                      {discoveredCount} / {total} discovered
                    </Text>
                  </View>
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-background-element/15">
                    <SymbolView
                      name={{ ios: 'book.fill', android: 'menu_book', web: 'menu_book' }}
                      tintColor={theme.backgroundElement}
                      size={26}
                    />
                  </View>
                </View>
                <View
                  accessibilityRole="progressbar"
                  accessibilityValue={{ min: 0, max: total, now: discoveredCount }}
                  className="h-2.5 overflow-hidden rounded-full bg-background-element/20">
                  <View className="h-full rounded-full bg-background-element" style={{ width: `${progress * 100}%` }} />
                </View>
                <Text className="type-caption text-background-element/80">
                  {discoveredCount === total && total > 0
                    ? 'Every one discovered. Nice gardening!'
                    : 'Add a plant to your garden to discover its species.'}
                </Text>
              </View>
            }
            ListFooterComponent={
              visible.length === 0 ? (
                <View className="items-center gap-2 rounded-3xl border-[1.5px] border-dashed border-input-border p-8">
                  <SymbolView name={{ ios: 'leaf', android: 'eco', web: 'eco' }} tintColor={theme.accentMuted} size={32} />
                  <Text className="type-subtitle-large text-text">No species match</Text>
                  <Text className="type-body-medium text-center text-text-secondary">
                    Try another name or clear the filters.
                  </Text>
                  <Button label="Clear filters" variant="secondary" onPress={clearAll} />
                </View>
              ) : undefined
            }
            renderItem={({ item: row }) =>
              row === 'filters' ? (
                // A solid background so the cards scroll out of sight beneath it once it sticks.
                <View className="gap-3 bg-background py-2">
                  <SearchField
                    value={query}
                    onChangeText={setQuery}
                    accessibilityLabel="Search species"
                    placeholder="Name or scientific name"
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
                        label="Discovered"
                        icon={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
                        selected={filter.only === 'discovered'}
                        onPress={() => toggle('discovered')}
                      />
                    </View>
                    <RegionSelect
                      regions={regionsOf(species, discovered)}
                      selected={filter.region}
                      onSelect={(region) => setFilter((current) => ({ ...current, region }))}
                    />
                  </View>
                </View>
              ) : (
                <View className="flex-row justify-between" pointerEvents={isPluntdexStep ? 'none' : 'auto'}>
                  {row.map((s) => (
                    <SpeciesCard
                      key={s.id}
                      species={s}
                      number={numbers.get(s.id) ?? ''}
                      discovered={discovered.has(s.id)}
                      onPress={() => router.push({ pathname: '/species/[id]', params: { id: s.id } })}
                    />
                  ))}
                </View>
              )
            }
          />
        )}

        {isPluntdexStep && (
          <View className="absolute inset-x-3 bottom-3">
            <OnboardingCard
              step="pluntdex"
              title="Explore the PluntDex"
              body="Every plant species, numbered. Each new species you add to your garden is discovered here, so the count grows with your garden."
              actionLabel="Got it"
              onAction={next}
              showNotNow={false}
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Lateef needs a taller line than type-h4's or iOS clips its glyphs. A style, as leading-* loses to type-h4.
  count: {
    lineHeight: 46,
    includeFontPadding: false,
  },
});
