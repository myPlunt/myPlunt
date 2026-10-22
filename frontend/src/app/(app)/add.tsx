import { useLocalSearchParams } from 'expo-router';

import { AddPlantScreen } from '@/features/plants/screens/add-plant-screen';

export default function Add() {
  // Set when opened from a species' Pluntdex page; the name fills the field before the species load.
  const { speciesId, speciesName } = useLocalSearchParams<{ speciesId?: string; speciesName?: string }>();
  return (
    <AddPlantScreen initialSpecies={speciesId && speciesName ? { id: speciesId, commonName: speciesName } : undefined} />
  );
}
