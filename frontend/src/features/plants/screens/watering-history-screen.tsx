import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { OfflineNote } from '@/components/ui/offline-note';
import { Shadow } from '@/constants/theme';
import { lastWateredLabel } from '@/features/garden/watering';
import { useWateringHistory } from '@/features/plants/use-watering-history';
import { lateLabel } from '@/features/plants/watering-history';
import { useTheme } from '@/hooks/use-theme';
import type { Watering, WateringHistory } from '@/lib/plant/types';

/**
 * Every watering of one plant, opened from its details: the current and best streak, how
 * often it was watered on time, and each watering marked on time or late.
 */
export function WateringHistoryScreen({ plantId }: { plantId: string }) {
  const theme = useTheme();
  const { history, savedAt, error, isLoading, retry } = useWateringHistory(plantId);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader showBack />

        <ScrollView contentContainerClassName="w-full max-w-content grow gap-6 self-center px-6 pb-8 pt-2">
          {isLoading ? (
            // A colour prop, so it reads the theme instead of a class.
            <ActivityIndicator accessibilityLabel="Loading waterings" color={theme.primary} className="mt-6" />
          ) : error ? (
            <View className="items-center gap-3">
              <Text className="type-body-medium text-error">{error}</Text>
              <Button label="Try again" variant="secondary" onPress={retry} />
            </View>
          ) : (
            history && (
              <>
                {savedAt && <OfflineNote savedAt={savedAt} />}
                <WateringHistoryContent history={history} />
              </>
            )
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function WateringHistoryContent({ history }: { history: WateringHistory }) {
  // Taken per render, so "Today" moves on past midnight.
  const now = new Date();
  const days = history.wateringFrequencyDays;

  return (
    <>
      <View>
        <Text accessibilityRole="header" className="type-h3 text-action-primary" style={styles.title}>
          Watering history
        </Text>
        <Text className="type-subtitle-large text-text-secondary">{history.plantName}</Text>
      </View>

      {/* Shadow goes through style so it sets both iOS shadow* and Android elevation. */}
      <View
        className="gap-3 rounded-2xl border-[1.5px] border-input-border bg-background-element p-4"
        style={Shadow.card}>
        <Text className="type-label text-accent">CONSISTENCY</Text>
        <View className="flex-row">
          <Stat label="Current streak" value={String(history.currentStreak)} />
          <Stat label="Best streak" value={String(history.bestStreak)} />
          <Stat label="On time" value={history.onTimePercent === null ? '–' : `${history.onTimePercent}%`} />
        </View>
        <Text className="type-caption text-text-secondary">
          {history.overdue
            ? `${history.plantName} is overdue, so the streak is broken. Water it to start a new one.`
            : `A streak counts waterings in a row on the day they're due, every ${days} ${days === 1 ? 'day' : 'days'}. Watering early doesn't add to it; watering late ends it.`}
        </Text>
      </View>

      <View
        className="gap-3 rounded-2xl border-[1.5px] border-input-border bg-background-element p-4"
        style={Shadow.card}>
        <Text className="type-label text-accent">WATERINGS</Text>
        {history.waterings.length === 0 ? (
          <Text className="type-body-large text-text-secondary">
            No waterings yet. Tap the drop in your garden when you water {history.plantName}.
          </Text>
        ) : (
          history.waterings.map((watering) => <WateringRow key={watering.id} watering={watering} now={now} />)
        )}
      </View>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    // Read as one phrase ("Current streak: 3") by screen readers, not a bare number then a label.
    <View accessible accessibilityLabel={`${label}: ${value}`} className="flex-1 items-center">
      <Text className="type-h4 text-action-primary" style={styles.statValue}>
        {value}
      </Text>
      <Text className="type-caption text-center text-text-secondary">{label}</Text>
    </View>
  );
}

function WateringRow({ watering, now }: { watering: Watering; now: Date }) {
  const theme = useTheme();
  const isLate = watering.daysLate > 0;
  const date = new Date(watering.wateredAt).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const when = lastWateredLabel(watering.wateredAt, now);

  return (
    // One phrase for screen readers ("Watered 2 days ago, 13 Oct 2026, on time") instead of four pieces.
    <View
      accessible
      accessibilityLabel={`Watered ${when.toLowerCase()}, ${date}, ${lateLabel(watering.daysLate).toLowerCase()}`}
      className="flex-row items-center gap-3">
      {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
      <SymbolView
        name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
        tintColor={theme.water}
        size={18}
      />
      <View className="flex-1">
        <Text className="type-body-large text-text">{when}</Text>
        <Text className="type-caption text-text-secondary">{date}</Text>
      </View>
      {/* Tints are the tone colour at low opacity, like the watering pill, so no new palette colours. */}
      <View className={`rounded-full px-2.5 py-1 ${isLate ? 'bg-error/15' : 'bg-primary/15'}`}>
        <Text className={`type-body-medium ${isLate ? 'text-error' : 'text-primary'}`}>
          {lateLabel(watering.daysLate)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Lateef's natural line is ~1.45× its size; a shorter line height clips the bottom of
  // the glyphs on iOS. Android's extra font padding is dropped so both platforms place it
  // the same. Styles, because a leading-* class loses to type-*.
  title: {
    lineHeight: 58,
    includeFontPadding: false,
  },
  statValue: {
    lineHeight: 46,
    includeFontPadding: false,
  },
});
