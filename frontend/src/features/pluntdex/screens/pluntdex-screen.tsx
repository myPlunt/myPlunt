import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { useGarden } from '@/features/garden/use-garden';
import { useSpecies } from '@/features/species/use-species';
import { useTheme } from '@/hooks/use-theme';

// Every approved species, numbered like a Pokédex. Species the user owns a plant of
// are "caught"; the rest are shown greyed out. The garden reloads on focus, so a
// plant added from the tab bar counts as soon as the user comes back here.
export function PluntdexScreen() {
  const theme = useTheme();
  const { species, error: speciesError } = useSpecies();
  const { garden, error: gardenError, isLoading, retry } = useGarden();

  const caught = new Set(garden?.rooms.flatMap((room) => room.plants.map((plant) => plant.speciesId)));
  const caughtCount = species?.filter((s) => caught.has(s.id)).length ?? 0;
  const error = speciesError ?? gardenError;

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <AppHeader />

        <ScrollView contentContainerClassName="w-full max-w-content grow gap-3 self-center px-6 pb-8 pt-2">
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
              <Text className="type-body-large text-text-secondary">
                {caughtCount} / {species.length} discovered
              </Text>
              {species.map((s, index) => {
                const isCaught = caught.has(s.id);
                return (
                  <View
                    key={s.id}
                    accessible
                    accessibilityLabel={`${s.commonName}, ${isCaught ? 'caught' : 'not caught yet'}`}
                    className={`flex-row items-center gap-4 rounded-2xl border border-border bg-background-element p-4 ${
                      isCaught ? '' : 'opacity-40'
                    }`}>
                    <Text className="type-label text-text-secondary">#{String(index + 1).padStart(3, '0')}</Text>
                    <View className="flex-1">
                      <Text className="type-subtitle-large text-text" numberOfLines={1}>
                        {s.commonName}
                      </Text>
                      <Text className="type-body-medium italic text-text-secondary" numberOfLines={1}>
                        {s.scientificName}
                      </Text>
                    </View>
                    {isCaught && (
                      <SymbolView
                        name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
                        tintColor={theme.primary}
                        size={24}
                      />
                    )}
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
