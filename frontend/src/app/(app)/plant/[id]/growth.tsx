import { useLocalSearchParams } from 'expo-router';

import { GrowthScreen } from '@/features/plants/screens/growth-screen';

export default function Growth() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GrowthScreen plantId={id} />;
}
