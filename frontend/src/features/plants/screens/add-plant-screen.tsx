import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { useGarden } from '@/features/garden/use-garden';
import { NotebookPage } from '@/features/plants/components/notebook-page';
import { RuledLine } from '@/features/plants/components/notebook-paper';
import { PlantForm } from '@/features/plants/components/plant-form';
import { DiscoveryDialog } from '@/features/pluntdex/components/discovery-dialog';
import { useDiscoveredSpecies } from '@/features/species/use-discovered-species';
import { useSpecies } from '@/features/species/use-species';
import type { Plant } from '@/lib/plant/types';
import type { Species } from '@/lib/species/types';
import { useOnboardingStore } from '@/stores/onboarding-store';

// Opened from the tab bar's + button, or from a species' Pluntdex page with that species
// already picked; the whole page is a sheet of notebook paper.
export function AddPlantScreen({ initialSpecies }: { initialSpecies?: Pick<Species, 'id' | 'commonName'> }) {
  const router = useRouter();
  // The garden's rooms are the user's planters; the group without an id is "Other plants".
  const { garden, error: plantersError } = useGarden();
  const { species, error: speciesError } = useSpecies();
  const { discovered } = useDiscoveredSpecies();
  const [justDiscovered, setJustDiscovered] = useState<Species | null>(null);
  const { step, next } = useOnboardingStore();
  // Set when the tour's first-plant step saved a plant: the next step, its first photo, is on
  // the plant's page, which opens once this sheet closes (after the discovery, if any).
  const [tourPlantId, setTourPlantId] = useState<string | null>(null);
  function close(openPlantId: string | null = null) {
    // Nothing underneath when the app was opened (or reloaded) straight onto this page,
    // so go to the garden, where the new plant shows up.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/garden');
    }
    if (openPlantId) router.push({ pathname: '/plant/[id]', params: { id: openPlantId } });
  }

  function saved(plant: Plant) {
    // The plant is what the tour's first-plant step asked for, so it moves on.
    const openPlantId = step === 'plant' ? plant.id : null;
    if (openPlantId) next(openPlantId);
    // Only once the discovered list has loaded, so a slow or failed load never celebrates a
    // species the user already has.
    const isNew =
      plant.speciesId !== null && discovered !== null && !discovered.some((d) => d.speciesId === plant.speciesId);
    const newSpecies = isNew ? species?.find((s) => s.id === plant.speciesId) : undefined;
    if (newSpecies) {
      setTourPlantId(openPlantId);
      setJustDiscovered(newSpecies);
    } else {
      close(openPlantId);
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
        initialSpecies={initialSpecies}
        species={species}
        speciesError={speciesError}
        planters={planters}
        plantersError={plantersError}
        onSaved={saved}
      />
      <DiscoveryDialog
        species={justDiscovered}
        number={justDiscovered && species ? String(species.indexOf(justDiscovered) + 1).padStart(3, '0') : ''}
        onClose={() => close(tourPlantId)}
      />
    </NotebookPage>
  );
}
