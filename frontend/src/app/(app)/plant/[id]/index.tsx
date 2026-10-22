import { useLocalSearchParams } from 'expo-router';

import { PlantDetailsScreen } from '@/features/plants/screens/plant-details-screen';

export default function PlantDetails() {
  // ownerId is set when the plant was opened from a friend's garden.
  const { id, ownerId } = useLocalSearchParams<{ id: string; ownerId?: string }>();
  return <PlantDetailsScreen plantId={id} ownerId={ownerId} />;
}
