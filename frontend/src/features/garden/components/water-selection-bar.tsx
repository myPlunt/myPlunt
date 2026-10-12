import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Shadow } from '@/constants/theme';

interface WaterSelectionBarProps {
  selectedCount: number;
  onWater: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

/** Sits under the garden while the user picks plants to water, with the count and the actions. */
export function WaterSelectionBar({ selectedCount, onWater, onCancel, loading, error }: WaterSelectionBarProps) {
  const title =
    selectedCount === 0
      ? 'Tap the plants you watered'
      : `${selectedCount} ${selectedCount === 1 ? 'plant' : 'plants'} selected`;

  return (
    // Shadow goes through style so it sets both iOS shadow* and Android elevation.
    <View className="w-full max-w-content gap-2 self-center rounded-t-3xl bg-background-element px-6 py-4" style={Shadow.card}>
      <View className="flex-row items-center gap-3">
        <Text className="type-subtitle-small flex-1 text-text">{title}</Text>
        <Button label="Cancel" variant="ghost" onPress={onCancel} disabled={loading} />
        <Button
          label="Water"
          accessibilityLabel={`Water ${selectedCount} ${selectedCount === 1 ? 'plant' : 'plants'}`}
          onPress={onWater}
          disabled={selectedCount === 0}
          loading={loading}
        />
      </View>
      {error && <Text className="type-caption text-error">{error}</Text>}
    </View>
  );
}
