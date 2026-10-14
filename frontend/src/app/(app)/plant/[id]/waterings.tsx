import { useLocalSearchParams } from 'expo-router';

import { WateringHistoryScreen } from '@/features/plants/screens/watering-history-screen';

export default function WateringHistory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WateringHistoryScreen plantId={id} />;
}
