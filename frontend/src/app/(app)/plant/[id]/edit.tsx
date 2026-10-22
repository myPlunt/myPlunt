import { useLocalSearchParams } from 'expo-router';

import { EditPlantScreen } from '@/features/plants/screens/edit-plant-screen';

export default function EditPlant() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditPlantScreen plantId={id} />;
}
