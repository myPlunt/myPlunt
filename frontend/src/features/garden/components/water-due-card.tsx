import { SymbolView } from 'expo-symbols';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GardenPlant } from '@/lib/garden/types';
import { useNetworkStore } from '@/stores/network-store';

import { listPlantNames } from '../watering';

interface WaterDueCardProps {
  plants: GardenPlant[];
  onWater: () => void;
  loading: boolean;
  error: string | null;
}

export function WaterDueCard({ plants, onWater, loading, error }: WaterDueCardProps) {
  const theme = useTheme();
  const { isOffline, explainOffline } = useNetworkStore();
  const title = `${plants.length} ${plants.length === 1 ? 'needs' : 'need'} water today`;

  return (
    <View
      className="gap-2 overflow-hidden rounded-2xl border-l-4 border-water bg-background-element p-4"
      style={Shadow.card}>
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-water/15">
          <SymbolView
            name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
            tintColor={theme.water}
            size={22}
          />
        </View>
        <View className="flex-1">
          <Text className="type-subtitle-small text-text">{title}</Text>
          <Text className="type-caption text-text-secondary" numberOfLines={1}>
            {listPlantNames(plants)}
          </Text>
        </View>
        <Button
          label="Water"
          accessibilityLabel={`Water ${listPlantNames(plants)}`}
          loading={loading}
          dimmed={isOffline}
          onPress={isOffline ? () => explainOffline('Watering') : onWater}
        />
      </View>
      {error && <Text className="type-caption text-error">{error}</Text>}
    </View>
  );
}
