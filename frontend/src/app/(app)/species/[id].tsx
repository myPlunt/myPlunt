import { useLocalSearchParams } from 'expo-router';

import { SpeciesDetailsScreen } from '@/features/pluntdex/screens/species-details-screen';

export default function SpeciesDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SpeciesDetailsScreen speciesId={id} />;
}
