import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { addMonths, calendarWeeks, dayKey, startOfMonth } from '@/features/profile/watering-calendar';
import { useTheme } from '@/hooks/use-theme';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface DatePickerDialogProps {
  title: string;
  value: Date;
  minDate: Date;
  onPick: (date: Date) => void;
  onClose: () => void;
}

/** Our own month grid, not the native pickers, which look different on iOS and Android. */
export function DatePickerDialog({ title, value, minDate, onPick, onClose }: DatePickerDialogProps) {
  const [month, setMonth] = useState(startOfMonth(value));
  const canGoBack = month > startOfMonth(minDate);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          className="absolute inset-0 bg-text opacity-40"
        />
        <View className="w-full max-w-[360px] gap-3 rounded-2xl bg-background-element p-5" style={Shadow.card}>
          <Text accessibilityRole="header" className="type-subtitle-large text-text">
            {title}
          </Text>
          <View className="flex-row items-center justify-between">
            <MonthButton direction="previous" disabled={!canGoBack} onPress={() => setMonth(addMonths(month, -1))} />
            <Text className="type-subtitle-small text-text">
              {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </Text>
            <MonthButton direction="next" onPress={() => setMonth(addMonths(month, 1))} />
          </View>
          <View className="flex-row">
            {WEEKDAYS.map((weekday, index) => (
              <Text key={index} className="type-caption flex-1 text-center text-text-secondary">
                {weekday}
              </Text>
            ))}
          </View>
          {calendarWeeks(month).map((week, index) => (
            <View key={index} className="flex-row">
              {week.map((day, dayIndex) => {
                if (!day) return <View key={dayIndex} className="flex-1" />;
                const isSelected = dayKey(day) === dayKey(value);
                const isDisabled = day < minDate;
                return (
                  <Pressable
                    key={dayIndex}
                    accessibilityRole="button"
                    accessibilityLabel={day.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                    accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                    disabled={isDisabled}
                    onPress={() => onPick(day)}
                    className={`h-11 flex-1 items-center justify-center rounded-full active:opacity-70 ${
                      isSelected ? 'bg-action-primary' : ''
                    } ${isDisabled ? 'opacity-30' : ''}`}>
                    <Text className={`type-body-medium ${isSelected ? 'text-snow' : 'text-text'}`}>{day.getDate()}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

function MonthButton({ direction, onPress, disabled }: { direction: 'previous' | 'next'; onPress: () => void; disabled?: boolean }) {
  const theme = useTheme();
  const isNext = direction === 'next';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isNext ? 'Next month' : 'Previous month'}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`h-10 w-10 items-center justify-center active:opacity-70 ${disabled ? 'opacity-30' : ''}`}>
      <SymbolView
        name={
          isNext
            ? { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }
            : { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }
        }
        tintColor={theme.actionPrimary}
        size={18}
      />
    </Pressable>
  );
}
