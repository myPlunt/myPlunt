import { SymbolView } from 'expo-symbols';
import { Text, View } from 'react-native';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { wateringStatus, type WateringTone } from '../watering';

// Tints are the tone colour at low opacity, so the palette gets no new colours.
const toneStyles: Record<WateringTone, { pill: string; text: string; icon: ThemeColor }> = {
  later: { pill: 'bg-water/15', text: 'text-water', icon: 'water' },
  soon: { pill: 'bg-watering-soon/15', text: 'text-watering-soon', icon: 'wateringSoon' },
  tomorrow: { pill: 'bg-watering-tomorrow/15', text: 'text-watering-tomorrow', icon: 'wateringTomorrow' },
  due: { pill: 'bg-error/15', text: 'text-error', icon: 'error' },
};

interface WateringPillProps {
  plant: Parameters<typeof wateringStatus>[0];
  now: Date;
}

export function WateringPill({ plant, now }: WateringPillProps) {
  const theme = useTheme();
  const status = wateringStatus(plant, now);
  const tone = toneStyles[status.tone];

  return (
    <View className={`flex-row items-center gap-1 self-start rounded-full px-2.5 py-1 ${tone.pill}`}>
      <SymbolView
        name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
        tintColor={theme[tone.icon]}
        size={12}
      />
      <Text className={`type-body-medium ${tone.text}`}>{status.label}</Text>
    </View>
  );
}

/** Under the pill or the last watering, while a watering made offline hasn't been sent. */
export function NotSyncedNote() {
  const theme = useTheme();
  return (
    <View className="flex-row items-center gap-1">
      <SymbolView
        name={{ ios: 'icloud.and.arrow.up', android: 'cloud_upload', web: 'cloud_upload' }}
        tintColor={theme.textSecondary}
        size={12}
      />
      <Text className="type-caption text-text-secondary">Not synced yet</Text>
    </View>
  );
}
