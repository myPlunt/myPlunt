import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { addMonths, calendarWeeks, dayKey, startOfMonth } from '@/features/profile/watering-calendar';
import { useTheme } from '@/hooks/use-theme';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface DatePickerDialogProps {
  /** The day picked so far, which the calendar opens on. */
  value: Date;
  /** Called with midnight on the picked day, in the device's time zone. */
  onPick: (day: Date) => void;
  onClose: () => void;
}

/**
 * A popup calendar for picking a day up to today. Our own rather than the native pickers,
 * so it looks the same on iOS and Android. Year arrows next to the month ones make going
 * back a few years quick. Render it only while open, so it opens on `value` each time.
 */
export function DatePickerDialog({ value, onPick, onClose }: DatePickerDialogProps) {
  const [month, setMonth] = useState(startOfMonth(value));
  // Taken per render, so the last pickable day moves on past midnight.
  const today = new Date();
  const thisMonth = startOfMonth(today);
  const picked = dayKey(value);

  return (
    // onRequestClose is Android's back button.
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          className="absolute inset-0 bg-text opacity-40"
        />
        {/* Shadow tokens set both iOS shadow* and Android elevation. */}
        <View className="w-full max-w-[360px] gap-2 rounded-2xl bg-background-element p-4" style={Shadow.card}>
          <View className="flex-row items-center">
            <NavButton
              label="Previous year"
              icon={{ ios: 'chevron.left.2', android: 'keyboard_double_arrow_left', web: 'keyboard_double_arrow_left' }}
              onPress={() => setMonth(addMonths(month, -12))}
            />
            <NavButton
              label="Previous month"
              icon={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
              onPress={() => setMonth(addMonths(month, -1))}
            />
            <Text accessibilityRole="header" className="type-subtitle-large flex-1 text-center text-text" numberOfLines={1}>
              {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </Text>
            <NavButton
              label="Next month"
              icon={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              disabled={month >= thisMonth}
              onPress={() => setMonth(addMonths(month, 1))}
            />
            <NavButton
              label="Next year"
              icon={{ ios: 'chevron.right.2', android: 'keyboard_double_arrow_right', web: 'keyboard_double_arrow_right' }}
              disabled={month >= thisMonth}
              // Never past this month: from March 2026 in an October 2026 world, that's October.
              onPress={() => setMonth(addMonths(month, 12) > thisMonth ? thisMonth : addMonths(month, 12))}
            />
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
                const isPicked = dayKey(day) === picked;
                // Photos can't be taken in the future; the backend refuses those dates too.
                const isFuture = day > today;
                return (
                  <Pressable
                    key={dayIndex}
                    accessibilityRole="button"
                    accessibilityLabel={day.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                    accessibilityState={{ selected: isPicked, disabled: isFuture }}
                    disabled={isFuture}
                    onPress={() => onPick(day)}
                    className={`flex-1 items-center py-0.5 active:opacity-70 ${isFuture ? 'opacity-30' : ''}`}>
                    <View
                      className={`h-9 w-9 items-center justify-center rounded-full ${
                        isPicked ? 'bg-action-primary' : ''
                      } ${dayKey(day) === dayKey(today) ? 'border-[1.5px] border-primary' : ''}`}>
                      <Text className={`type-body-medium ${isPicked ? 'text-background-element' : 'text-text'}`}>
                        {day.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={onClose}
            className="items-center py-2 active:opacity-70">
            <Text className="type-body-medium text-text-secondary">Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

interface NavButtonProps {
  label: string;
  icon: SymbolViewProps['name'];
  onPress: () => void;
  disabled?: boolean;
}

function NavButton({ label, icon, onPress, disabled }: NavButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`h-10 w-9 items-center justify-center active:opacity-70 ${disabled ? 'opacity-30' : ''}`}>
      {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
      <SymbolView name={icon} tintColor={theme.actionPrimary} size={18} />
    </Pressable>
  );
}
