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

export function AddPlantScreen({ initialSpecies }: { initialSpecies?: Pick<Species, 'id' | 'commonName'> }) {
  const router = useRouter();
  // The garden's rooms are the user's planters; the group without an id is "Other plants".
  const { garden, error: plantersError } = useGarden();
  const { species, error: speciesError } = useSpecies();
  const { discovered } = useDiscoveredSpecies();
  const [justDiscovered, setJustDiscovered] = useState<Species | null>(null);
  const { step, next } = useOnboardingStore();
  // Set when the tour's first-plant step saved a plant: its page opens once this sheet closes.
  const [tourPlantId, setTourPlantId] = useState<string | null>(null);
  function close(openPlantId: string | null = null) {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/garden');
    }
    if (openPlantId) router.push({ pathname: '/plant/[id]', params: { id: openPlantId } });
  }

  function saved(plant: Plant) {
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
