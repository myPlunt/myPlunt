import { useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useGarden } from '@/features/garden/use-garden';
import { NotebookPage } from '@/features/plants/components/notebook-page';
import { oneLine, RuledLine } from '@/features/plants/components/notebook-paper';
import { PlantForm } from '@/features/plants/components/plant-form';
import { usePlant } from '@/features/plants/use-plant';
import { useSpecies } from '@/features/species/use-species';
import { useTheme } from '@/hooks/use-theme';

// Opened from the pencil on a plant's details; the same notebook form as adding a plant, filled in.
export function EditPlantScreen({ plantId }: { plantId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const { plant, error, isLoading, retry } = usePlant(plantId);
  // The garden's rooms are the user's planters; the group without an id is "Other plants".
  const { garden, error: plantersError } = useGarden();
  const { species, error: speciesError } = useSpecies();

  function close() {
    // Nothing underneath when the app was opened (or reloaded) straight onto this page,
    // so go to the plant's details, which show the saved changes.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: '/plant/[id]', params: { id: plantId } });
    }
  }

  const planters = garden?.rooms.flatMap((room) => (room.id ? [{ id: room.id, name: room.name }] : [])) ?? null;

  return (
    <NotebookPage title="Edit your plant">
      {isLoading ? (
        <View className="justify-center" style={oneLine}>
          {/* A colour prop, so it reads the theme instead of a class. */}
          <ActivityIndicator accessibilityLabel="Loading plant" color={theme.primary} className="self-start" />
        </View>
      ) : error ? (
        <>
          <RuledLine>
            <Text className="type-body-medium text-error" numberOfLines={1} adjustsFontSizeToFit>
              {error}
            </Text>
          </RuledLine>
          <View className="justify-center" style={oneLine}>
            <Button label="Try again" variant="secondary" onPress={retry} />
          </View>
        </>
      ) : (
        plant && (
          <>
            <RuledLine>
              <Text className="type-body-medium text-text-secondary" numberOfLines={1} adjustsFontSizeToFit>
                Change what you like, then save.
              </Text>
            </RuledLine>
            {/* Keyed by the plant, so the form fills in once and later refetches (on focus)
                don't overwrite what the user is typing. */}
            <PlantForm
              key={plant.id}
              plant={plant}
              species={species}
              speciesError={speciesError}
              planters={planters}
              plantersError={plantersError}
              onSaved={close}
            />
          </>
        )
      )}
    </NotebookPage>
  );
}
