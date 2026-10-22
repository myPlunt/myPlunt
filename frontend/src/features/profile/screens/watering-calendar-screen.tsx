import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { WateringCalendar } from '@/features/profile/components/watering-calendar';
import { useWateringCalendar } from '@/features/profile/use-watering-calendar';

export function WateringCalendarScreen() {
  const calendar = useWateringCalendar();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader showBack />

        <ScrollView contentContainerClassName="w-full max-w-content grow gap-6 self-center px-6 pb-8 pt-2">
          <Text accessibilityRole="header" className="type-h3 text-action-primary" style={styles.title}>
            Watering calendar
          </Text>
          {calendar.error ? (
            <View className="items-center gap-3">
              <Text className="type-body-medium text-error">{calendar.error}</Text>
              <Button label="Try again" variant="secondary" onPress={calendar.retry} />
            </View>
          ) : (
            // Keyed by month, so the picked day starts over on today (or nothing) after paging.
            <WateringCalendar
              key={calendar.month.getTime()}
              month={calendar.month}
              waterings={calendar.waterings}
              isLoading={calendar.isLoading}
              canShowNextMonth={calendar.canShowNextMonth}
              onPreviousMonth={calendar.showPreviousMonth}
              onNextMonth={calendar.showNextMonth}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Lateef needs a taller line or iOS clips its glyphs. A style, as a leading-* class loses to type-h3.
  title: {
    lineHeight: 58,
    includeFontPadding: false,
  },
});
