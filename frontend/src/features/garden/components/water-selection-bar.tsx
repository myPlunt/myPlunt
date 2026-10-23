import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Shadow } from '@/constants/theme';

interface WaterSelectionBarProps {
  selectedCount: number;
  onWater: () => void;
  onCancel: () => void;
  loading: boolean;
}

export function WaterSelectionBar({ selectedCount, onWater, onCancel, loading }: WaterSelectionBarProps) {
  const title =
    selectedCount === 0
      ? 'Tap to select the plants you watered.'
      : `${selectedCount} ${selectedCount === 1 ? 'plant' : 'plants'} selected`;

  return (
    <View className="w-full max-w-content gap-2 self-center rounded-t-3xl bg-background-element px-6 py-4" style={Shadow.card}>
      <Text className="type-subtitle-small text-center text-text">{title}</Text>
      <View className="flex-row items-center justify-center gap-8">
        <Button label="Cancel" variant="ghost" onPress={onCancel} disabled={loading} />
        <Button
          label="Water"
          accessibilityLabel={`Water ${selectedCount} ${selectedCount === 1 ? 'plant' : 'plants'}`}
          onPress={onWater}
          disabled={selectedCount === 0}
          loading={loading}
        />
      </View>
    </View>
  );
}
