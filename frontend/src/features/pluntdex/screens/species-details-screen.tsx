import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Shadow } from '@/constants/theme';
import { useGarden } from '@/features/garden/use-garden';
import { DetailRow } from '@/features/plants/components/detail-row';
import { SpeciesPicture } from '@/features/pluntdex/components/species-picture';
import { useDiscoveredSpecies } from '@/features/species/use-discovered-species';
import { useSpecies } from '@/features/species/use-species';
import { useTheme } from '@/hooks/use-theme';

/**
 * One Pluntdex entry, opened from its card. A discovered species shows when it was discovered
 * and the user's plants of it; one not discovered yet keeps its picture blurred and offers to
 * add a plant of it, which discovers it.
 */
export function SpeciesDetailsScreen({ speciesId }: { speciesId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const { species, error: speciesError, retry: retrySpecies } = useSpecies();
  // Both reload on focus, so coming back from adding a plant shows the species discovered.
  const { discovered, error: discoveredError, isLoading, retry: retryDiscovered } = useDiscoveredSpecies();
  const { garden } = useGarden();

  const index = species?.findIndex((s) => s.id === speciesId) ?? -1;
  const entry = species?.[index];
  const discoveredAt = discovered?.find((c) => c.speciesId === speciesId)?.discoveredAt ?? null;
  // Plants can be deleted since, so a discovered species may have none left.
  const plants = garden?.rooms.flatMap((room) => room.plants).filter((p) => p.speciesId === speciesId) ?? [];
  const error = speciesError ?? discoveredError;
  // Loads again whichever of the two failed.
  function retry() {
    if (speciesError) retrySpecies();
    if (discoveredError) retryDiscovered();
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader showBack />

        <ScrollView contentContainerClassName="w-full max-w-content grow gap-6 self-center px-6 pb-8 pt-2">
          {error ? (
            <View className="items-center gap-3">
              <Text className="type-body-medium text-error">{error}</Text>
              <Button label="Try again" variant="secondary" onPress={retry} />
            </View>
          ) : isLoading || !species ? (
            // A colour prop, so it reads the theme instead of a class.
            <ActivityIndicator accessibilityLabel="Loading species" color={theme.primary} className="mt-6" />
          ) : !entry ? (
            <Text className="type-body-medium text-center text-text-secondary">
              This species isn&apos;t in the Pluntdex.
            </Text>
          ) : (
            <>
              {/* The name belongs to the picture, so it sits closer to it than the page's gap-6. */}
              <View className="gap-3">
                <View>
                  <SpeciesPicture
                    species={entry}
                    discovered={discoveredAt !== null}
                    className="aspect-square w-full rounded-3xl border-[1.5px] border-input-border"
                    iconSize={64}
                  />
                  <View className="absolute left-3 top-3 rounded-full bg-background-element/90 px-2.5 py-1">
                    <Text className="type-label text-accent">#{String(index + 1).padStart(3, '0')}</Text>
                  </View>
                </View>

                <View>
                  <Text accessibilityRole="header" className="type-h4 text-action-primary" style={styles.name}>
                    {entry.commonName}
                  </Text>
                  <Text className="type-subtitle-large italic text-text-secondary">{entry.scientificName}</Text>
                </View>
              </View>

              {/* Shadow goes through style so it sets both iOS shadow* and Android elevation. */}
              <View
                className="gap-3 rounded-2xl border-[1.5px] border-input-border bg-background-element p-4"
                style={Shadow.card}>
                <Text className="type-label text-accent">ABOUT</Text>
                <DetailRow label="Region" value={entry.region ?? 'Unknown'} />
                <DetailRow label="Light" value={entry.sunlightNeeds ?? 'Unknown'} />
                <DetailRow
                  label="Watering"
                  value={entry.wateringFrequencyDays === null ? 'Unknown' : `Every ${entry.wateringFrequencyDays} days`}
                />
              </View>

              {discoveredAt ? (
                <View
                  className="gap-3 rounded-2xl border-[1.5px] border-input-border bg-background-element p-4"
                  style={Shadow.card}>
                  <View className="flex-row items-center gap-2">
                    {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
                    <SymbolView
                      name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
                      tintColor={theme.primary}
                      size={18}
                    />
                    <Text className="type-body-large text-text">
                      Discovered on{' '}
                      {new Date(discoveredAt).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text className="type-label text-accent">YOUR PLANTS</Text>
                  {plants.length === 0 ? (
                    <Text className="type-body-medium text-text-secondary">None in your garden right now.</Text>
                  ) : (
                    plants.map((plant) => (
                      <Pressable
                        key={plant.id}
                        accessibilityRole="button"
                        accessibilityLabel={plant.name}
                        onPress={() => router.push({ pathname: '/plant/[id]', params: { id: plant.id } })}
                        className="flex-row items-center justify-between gap-4 active:opacity-70">
                        <Text className="type-body-large shrink text-text" numberOfLines={1}>
                          {plant.name}
                        </Text>
                        <SymbolView
                          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                          tintColor={theme.textSecondary}
                          size={14}
                        />
                      </Pressable>
                    ))
                  )}
                </View>
              ) : (
                <View className="items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-input-border p-5">
                  <Text className="type-subtitle-large text-text">Not discovered yet</Text>
                  <Text className="type-body-medium text-center text-text-secondary">
                    Add a {entry.commonName} to your garden to discover it.
                  </Text>
                  <Button
                    label="Add to garden"
                    onPress={() =>
                      router.push({
                        pathname: '/add',
                        params: { speciesId: entry.id, speciesName: entry.commonName },
                      })
                    }
                  />
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
  // Same as a plant's name on its details page: Lateef's natural line is ~1.45× its size, so
  // type-h4's 40 clips the glyphs on iOS; the negative margin pulls the capitals up towards
  // the picture. A style, because a leading-* class loses to type-h4.
  name: {
    lineHeight: 46,
    marginTop: -6,
    includeFontPadding: false,
  },
});
