import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import type { Room } from '@/lib/garden/types';

import { plantsNeedingWater, roomSummary, sortByNextWatering } from '../watering';
import { PlantCard } from './plant-card';

interface RoomSectionProps {
  room: Room;
  now: Date;
  /** Set while the user picks plants to water; the cards then toggle instead of opening. */
  selection?: {
    selectedIds: ReadonlySet<string>;
    onToggle: (plantId: string) => void;
    /** Selects (or, with false, deselects) all of the given plants at once. */
    onSelectMany: (plantIds: string[], selected: boolean) => void;
  };
  /** Opens the rename/delete dialog. Left out for "Other plants", which isn't a planter. */
  onEdit?: () => void;
}

// One room of the garden: its name and a sideways-scrolling row of plant cards,
// the one due soonest first.
export function RoomSection({ room, now, selection, onEdit }: RoomSectionProps) {
  const theme = useTheme();
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
                  onPress={onEdit}
                  hitSlop={8}
                  className="h-6 w-6 items-center justify-center active:opacity-70">
                  {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
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
        // Bleeds to the screen edges (the -mx-6 undoes the screen's px-6) so cards scroll
        // off the side; the content padding keeps the first card in line with the title.
        // py-3 leaves room for the cards' shadow, which a ScrollView would clip.
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
  // Lateef has very tall ascent/descent metrics (room for Arabic marks). Any
  // lineHeight shorter than the font's natural height (26px * 2961/2048 ≈ 38)
  // gets clipped from the bottom on iOS, which shifts the glyphs up. Using the
  // natural height keeps the capitals centred in the box, and dropping Android's
  // extra font padding does the same there. This is a style, not classes: a
  // leading-* class loses to type-h5's own line height (plugin utilities come
  // later in the CSS), and the two Android props have no Tailwind class.
  title: {
    lineHeight: 38,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
