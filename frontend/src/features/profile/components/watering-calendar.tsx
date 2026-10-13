import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WateringLog } from '@/lib/plant/types';

import { calendarWeeks, dayKey, wateringsByDay } from '../watering-calendar';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface WateringCalendarProps {
  /** Midnight on the first of the month shown. */
  month: Date;
  waterings: WateringLog[];
  isLoading: boolean;
  canShowNextMonth: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

/**
 * A month of the user's waterings. Days with waterings are tinted water blue; pressing one
 * lists which plants were watered that day. Today has a ring. Opens on today when it's in
 * the month shown; the parent keys it by month so the picked day resets on paging.
 */
export function WateringCalendar({
  month,
  waterings,
  isLoading,
  canShowNextMonth,
  onPreviousMonth,
  onNextMonth,
}: WateringCalendarProps) {
  const theme = useTheme();
  const today = dayKey(new Date());
  const byDay = wateringsByDay(waterings);
  const [selectedDay, setSelectedDay] = useState(today);
  const selected = byDay.get(selectedDay) ?? [];
  const monthLabel = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    // Shadow goes through style so it sets both iOS shadow* and Android elevation.
    <View className="gap-3 rounded-2xl border-[1.5px] border-input-border bg-background-element p-4" style={Shadow.card}>
      <View className="flex-row items-center justify-between">
        <MonthButton direction="previous" onPress={onPreviousMonth} />
        <Text accessibilityRole="header" className="type-subtitle-large text-text">
          {monthLabel}
        </Text>
        <MonthButton direction="next" onPress={onNextMonth} disabled={!canShowNextMonth} />
      </View>

      <View className="flex-row">
        {WEEKDAYS.map((weekday, index) => (
          <Text key={index} className="type-caption flex-1 text-center text-text-secondary">
            {weekday}
          </Text>
        ))}
      </View>

      {isLoading ? (
        // A colour prop, so it reads the theme instead of a class.
        <ActivityIndicator accessibilityLabel="Loading waterings" color={theme.primary} className="my-6" />
      ) : (
        calendarWeeks(month).map((week, index) => (
          <View key={index} className="flex-row">
            {week.map((day, dayIndex) =>
              day ? (
                <CalendarDay
                  key={dayIndex}
                  day={day}
                  count={byDay.get(dayKey(day))?.length ?? 0}
                  isToday={dayKey(day) === today}
                  isSelected={dayKey(day) === selectedDay}
                  onPress={() => setSelectedDay(dayKey(day))}
                />
              ) : (
                <View key={dayIndex} className="flex-1" />
              ),
            )}
          </View>
        ))
      )}

      {!isLoading && (
        <View className="gap-2 border-t border-border pt-3">
          {waterings.length === 0 ? (
            <Text className="type-body-medium text-text-secondary">No waterings logged in {monthLabel}.</Text>
          ) : selected.length === 0 ? (
            <Text className="type-body-medium text-text-secondary">Pick a blue day to see what you watered.</Text>
          ) : (
            <>
              <Text className="type-label text-accent">
                {new Date(selected[0].wateredAt)
                  .toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
                  .toUpperCase()}
              </Text>
              {selected.map((watering) => (
                <WateringItem key={watering.id} watering={watering} />
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

function MonthButton({
  direction,
  onPress,
  disabled,
}: {
  direction: 'previous' | 'next';
  onPress: () => void;
  disabled?: boolean;
}) {
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
      {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
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

interface CalendarDayProps {
  day: Date;
  count: number;
  isToday: boolean;
  isSelected: boolean;
  onPress: () => void;
}

function CalendarDay({ day, count, isToday, isSelected, onPress }: CalendarDayProps) {
  const watered = count > 0;
  const date = day.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
  // Watered days are tinted, the picked one filled; today keeps a ring either way.
  const circle = isSelected && watered ? 'bg-water' : watered ? 'bg-water/15' : '';
  const text = isSelected && watered ? 'text-background-element' : watered ? 'text-water' : 'text-text';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${date}, ${count === 0 ? 'no waterings' : `${count} ${count === 1 ? 'watering' : 'waterings'}`}`}
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      className="flex-1 items-center py-0.5 active:opacity-70">
      <View
        className={`h-9 w-9 items-center justify-center rounded-full ${circle} ${
          isToday ? 'border-[1.5px] border-primary' : ''
        }`}>
        <Text className={`type-body-medium ${text}`}>{day.getDate()}</Text>
      </View>
    </Pressable>
  );
}

function WateringItem({ watering }: { watering: WateringLog }) {
  const theme = useTheme();
  const time = new Date(watering.wateredAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <View className="flex-row items-center gap-3">
      {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
      <SymbolView name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }} tintColor={theme.water} size={14} />
      <Text className="type-body-large flex-1 text-text" numberOfLines={1}>
        {watering.plantName}
      </Text>
      <Text className="type-body-medium text-text-secondary">{time}</Text>
    </View>
  );
}
