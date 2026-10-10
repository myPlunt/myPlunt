import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Room } from '@/lib/garden/types';

import { plantsNeedingWater, roomSummary, sortByWaterLevel } from '../watering';
import { PlantCard } from './plant-card';

interface RoomSectionProps {
  room: Room;
  now: Date;
}

// One room of the garden: its name and a sideways-scrolling row of plant cards,
// thirstiest first.
export function RoomSection({ room, now }: RoomSectionProps) {
  const needsWater = plantsNeedingWater({ rooms: [room] }, now).length > 0;

  return (
    <View className="gap-3">
      <View>
        <Text accessibilityRole="header" className="type-h5 text-action-primary" style={styles.title}>
          {room.name}
        </Text>
        <Text className={`type-body-medium ${needsWater ? 'text-accent' : 'text-text-secondary'}`}>
          {roomSummary(room, now)}
        </Text>
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
          {sortByWaterLevel(room.plants, now).map((plant) => (
            <PlantCard key={plant.id} plant={plant} now={now} />
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
