import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { useGarden } from '@/features/garden/use-garden';
import { NotebookPage } from '@/features/plants/components/notebook-page';
import { RuledLine } from '@/features/plants/components/notebook-paper';
import { PlantForm } from '@/features/plants/components/plant-form';
import { useSpecies } from '@/features/species/use-species';

// Opened from the tab bar's + button; the whole page is a sheet of notebook paper.
export function AddPlantScreen() {
  const router = useRouter();
  // The garden's rooms are the user's planters; the group without an id is "Other plants".
  const { garden, error: plantersError } = useGarden();
  const { species, error: speciesError } = useSpecies();
  function close() {
    // Nothing underneath when the app was opened (or reloaded) straight onto this page,
    // so go to the garden, where the new plant shows up.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/garden');
    }
  }

  const planters = garden?.rooms.flatMap((room) => (room.id ? [{ id: room.id, name: room.name }] : [])) ?? null;

  return (
    <NotebookPage title="Add your new plant">
      <RuledLine>
        <Text className="type-body-medium text-text-secondary" numberOfLines={1} adjustsFontSizeToFit>
          The more we know, the better we&apos;ll remind you.
        </Text>
      </RuledLine>
      {/* Closing the sheet refocuses the screen below; the garden reloads and shows the new plant. */}
      <PlantForm
        species={species}
        speciesError={speciesError}
        planters={planters}
        plantersError={plantersError}
        onSaved={close}
      />
    </NotebookPage>
  );
}
