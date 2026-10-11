import { useLocalSearchParams } from 'expo-router';

import { PlantDetailsScreen } from '@/features/plants/screens/plant-details-screen';

export default function PlantDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PlantDetailsScreen plantId={id} />;
}
