import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { DatePickerDialog } from '@/features/plants/components/date-picker-dialog';
import { RuledLine } from '@/features/plants/components/notebook-paper';
import { useTheme } from '@/hooks/use-theme';

interface TakenOnFieldProps {
  /** When the photo was taken (ISO); null shows today, which is what the backend uses then. */
  takenAt: string | null;
  onChange: (takenAt: string) => void;
}

/** "Taken on 20 Aug 2026 ✎ Change" on a ruled line; Change opens a calendar to fix the date. */
export function TakenOnField({ takenAt, onChange }: TakenOnFieldProps) {
  const theme = useTheme();
  const [isPicking, setIsPicking] = useState(false);
  const date = takenAt ? new Date(takenAt) : new Date();
  const label = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  function pick(day: Date) {
    setIsPicking(false);
    // Midday, so the day stays the same in nearby time zones; never later than now.
    const midday = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12);
    onChange(new Date(Math.min(midday.getTime(), Date.now())).toISOString());
  }

  return (
    <RuledLine>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Taken on ${label}. Change the date`}
        onPress={() => setIsPicking(true)}
        className="flex-row items-center gap-2 self-start active:opacity-70">
        <Text className="type-body-medium text-text-secondary" numberOfLines={1}>
          {`Taken on ${label}`}
        </Text>
        {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
        <SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} tintColor={theme.actionPrimary} size={14} />
        <Text className="type-button-medium text-action-primary">Change</Text>
      </Pressable>
      {isPicking && <DatePickerDialog value={date} onPick={pick} onClose={() => setIsPicking(false)} />}
    </RuledLine>
  );
}
