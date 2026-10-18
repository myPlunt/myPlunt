import { useLocalSearchParams } from 'expo-router';

import { AddPlantPhotoScreen } from '@/features/plants/screens/add-plant-photo-screen';

export default function AddPlantPhoto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AddPlantPhotoScreen plantId={id} />;
}
