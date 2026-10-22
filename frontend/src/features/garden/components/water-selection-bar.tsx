import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Shadow } from '@/constants/theme';
import { useNetworkStore } from '@/stores/network-store';

interface WaterSelectionBarProps {
  selectedCount: number;
  onWater: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

/** Sits under the garden while the user picks plants to water, with the count and the actions. */
export function WaterSelectionBar({ selectedCount, onWater, onCancel, loading, error }: WaterSelectionBarProps) {
  const { isOffline, explainOffline } = useNetworkStore();
  const title =
    selectedCount === 0
      ? 'Tap to select the plants you watered.'
      : `${selectedCount} ${selectedCount === 1 ? 'plant' : 'plants'} selected`;

  return (
    // Shadow goes through style so it sets both iOS shadow* and Android elevation.
    <View className="w-full max-w-content gap-2 self-center rounded-t-3xl bg-background-element px-6 py-4" style={Shadow.card}>
      <Text className="type-subtitle-small text-center text-text">{title}</Text>
      {/* The actions get their own row, so the title never has to wrap beside them:
          Cancel on the left, Water on the right, centred under the title. */}
      <View className="flex-row items-center justify-center gap-8">
        <Button label="Cancel" variant="ghost" onPress={onCancel} disabled={loading} />
        <Button
          label="Water"
          accessibilityLabel={`Water ${selectedCount} ${selectedCount === 1 ? 'plant' : 'plants'}`}
          onPress={isOffline ? () => explainOffline('Watering') : onWater}
          disabled={selectedCount === 0}
          dimmed={isOffline}
          loading={loading}
        />
      </View>
      {error && <Text className="type-caption text-center text-error">{error}</Text>}
    </View>
  );
}
