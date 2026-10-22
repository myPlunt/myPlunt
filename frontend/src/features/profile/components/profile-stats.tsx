import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ProfileStats as Stats } from '@/features/profile/profile-stats';
import { useTheme } from '@/hooks/use-theme';

interface ProfileStatsProps {
  stats: Stats | null;
  onOpenGarden?: () => void;
  onOpenPluntdex?: () => void;
}

export function ProfileStats({ stats, onOpenGarden, onOpenPluntdex }: ProfileStatsProps) {
  const theme = useTheme();

  return (
    <View className="flex-row py-1">
      <Stat
        value={stats ? String(stats.plants) : '–'}
        label="plants"
        accessibilityLabel={stats ? `${stats.plants} ${stats.plants === 1 ? 'plant' : 'plants'}` : 'Plants loading'}
        onPress={onOpenGarden}
      />
      <View className="w-px bg-border" />
      <Stat
        value={stats ? `${stats.discovered} / ${stats.total}` : '–'}
        label="discovered"
        accessibilityLabel={stats ? `${stats.discovered} of ${stats.total} species discovered` : 'Discovered loading'}
        onPress={onOpenPluntdex}
      />
      <View className="w-px bg-border" />
      <Stat
        value={stats ? String(stats.topStreak) : '–'}
        label="top streak"
        accessibilityLabel={stats ? `Top watering streak ${stats.topStreak}` : 'Top streak loading'}
        onPress={onOpenGarden}
        icon={
          <SymbolView name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }} tintColor={theme.water} size={14} />
        }
      />
    </View>
  );
}

interface StatProps {
  value: string;
  label: string;
  accessibilityLabel: string;
  onPress?: () => void;
  icon?: ReactNode;
}

function Stat({ value, label, accessibilityLabel, onPress, icon }: StatProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      disabled={!onPress}
      onPress={onPress}
      className="flex-1 items-center active:opacity-70">
      <View className="flex-row items-center gap-1">
        {icon}
        <Text className="type-h5 text-action-primary" style={styles.value}>
          {value}
        </Text>
      </View>
      <Text className="type-caption text-text-secondary">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Lateef needs a taller line than type-h5's or iOS clips its glyphs (as in RoomSection).
  value: {
    lineHeight: 38,
    includeFontPadding: false,
  },
});
