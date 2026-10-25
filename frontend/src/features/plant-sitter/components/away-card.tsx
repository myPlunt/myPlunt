import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GardenPlant } from '@/lib/garden/types';

import { addDays, startOfDay, tripDays, tripSummary, wateringsDuring } from '../away-trip';
import { DatePickerDialog } from './date-picker-dialog';

interface AwayCardProps {
  from: Date;
  until: Date;
  /** Null while the garden loads; the summary then leaves the plants out. */
  plants: GardenPlant[] | null;
  onChange: (from: Date, until: Date) => void;
}

export function AwayCard({ from, until, plants, onChange }: AwayCardProps) {
  const theme = useTheme();
  const [picking, setPicking] = useState<'from' | 'until' | null>(null);
  const days = tripDays(from, until);

  function pick(date: Date) {
    // Moving the start past the end drags the end along, keeping the trip's length.
    if (picking === 'from') onChange(date, date > until ? addDays(date, days - 1) : until);
    else onChange(from, date);
    setPicking(null);
  }

  return (
    <View className="gap-4 rounded-3xl bg-action-primary p-5" style={Shadow.card}>
      <View className="flex-row items-center gap-3">
        <SymbolView name={{ ios: 'key.fill', android: 'key', web: 'key' }} tintColor={theme.snow} size={22} />
        <Text className="type-subtitle-large text-snow">I&apos;m away</Text>
      </View>
      <View className="flex-row gap-3">
        <DateButton label="From" date={from} onPress={() => setPicking('from')} />
        <DateButton label="Until" date={until} onPress={() => setPicking('until')} />
      </View>
      <Text className="type-body-medium text-snow">
        {tripSummary(days, plants?.length ?? 0, plants ? wateringsDuring(plants, from, until) : 0)}
      </Text>

      {picking && (
        <DatePickerDialog
          title={picking === 'from' ? 'Away from' : 'Back after'}
          value={picking === 'from' ? from : until}
          minDate={picking === 'from' ? startOfDay(new Date()) : from}
          onPick={pick}
          onClose={() => setPicking(null)}
        />
      )}
    </View>
  );
}

function DateButton({ label, date, onPress }: { label: string; date: Date; onPress: () => void }) {
  const text = date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} ${text}`}
      onPress={onPress}
      className="flex-1 gap-0.5 rounded-2xl bg-snow/10 px-4 py-3 active:opacity-70">
      <Text className="type-caption text-snow">{label}</Text>
      <Text className="type-subtitle-large text-snow">{text}</Text>
    </Pressable>
  );
}
