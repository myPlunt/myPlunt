import { useLocalSearchParams } from 'expo-router';

import { EditPlantPhotoScreen } from '@/features/plants/screens/edit-plant-photo-screen';

export default function EditPlantPhoto() {
  const { id, photoId } = useLocalSearchParams<{ id: string; photoId: string }>();
  return <EditPlantPhotoScreen plantId={id} photoId={photoId} />;
}
