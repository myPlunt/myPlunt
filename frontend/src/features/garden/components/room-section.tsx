import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import type { Room } from '@/lib/garden/types';
import { useNetworkStore } from '@/stores/network-store';

import { plantsNeedingWater, roomSummary, sortByNextWatering } from '../watering';
import { PlantCard } from './plant-card';

interface RoomSectionProps {
  room: Room;
  now: Date;
  selection?: {
    selectedIds: ReadonlySet<string>;
    onToggle: (plantId: string) => void;
    onSelectMany: (plantIds: string[], selected: boolean) => void;
  };
  onEdit?: () => void;
  ownerId?: string;
}

export function RoomSection({ room, now, selection, onEdit, ownerId }: RoomSectionProps) {
  const theme = useTheme();
  const { isOffline, explainOffline } = useNetworkStore();
  const needsWater = plantsNeedingWater({ rooms: [room] }, now).length > 0;
  const plantIds = room.plants.map((plant) => plant.id);
  const allSelected = selection !== undefined && plantIds.every((id) => selection.selectedIds.has(id));

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            {onEdit &&
              (selection ? (
                // Same width as the pencil, so the name doesn't shift while picking plants.
                <View className="w-6" />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${room.name}`}
                  accessibilityHint={isOffline ? "Doesn't work offline" : undefined}
                  onPress={isOffline ? () => explainOffline('Editing planters') : onEdit}
                  hitSlop={8}
                  className={`h-6 w-6 items-center justify-center active:opacity-70 ${isOffline ? 'opacity-40' : ''}`}>
                  <SymbolView
                    name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                    tintColor={theme.textSecondary}
                    size={18}
                  />
                </Pressable>
              ))}
            <Text accessibilityRole="header" className="type-h5 text-action-primary" style={styles.title}>
              {room.name}
            </Text>
          </View>
          <Text className={`type-body-medium ${needsWater ? 'text-accent' : 'text-text-secondary'}`}>
            {roomSummary(room, now)}
          </Text>
        </View>
        {selection && plantIds.length > 0 && (
          <Button
            label={allSelected ? 'Deselect all' : 'Select all'}
            accessibilityLabel={`${allSelected ? 'Deselect' : 'Select'} all plants in ${room.name}`}
            variant="ghost"
            onPress={() => selection.onSelectMany(plantIds, !allSelected)}
          />
        )}
      </View>

      {room.plants.length === 0 ? (
        <Text className="type-body-medium text-text-secondary">No plants in this room yet.</Text>
      ) : (
        // -mx-6 bleeds to the screen edges; py-3 leaves room for the cards' shadow, which a ScrollView clips.
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-6"
          contentContainerClassName="gap-3 px-6 py-3">
          {sortByNextWatering(room.plants, now).map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              now={now}
              ownerId={ownerId}
              selection={
                selection && {
                  selected: selection.selectedIds.has(plant.id),
                  onToggle: () => selection.onToggle(plant.id),
                }
              }
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Lateef's tall metrics get clipped on iOS by any lineHeight under its natural ~38px, and Android
  // needs its font padding off. A style, because a leading-* class loses to type-h5's line height.
  title: {
    lineHeight: 38,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
