import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { RoomSection } from '@/features/garden/components/room-section';
import { WaterDueCard } from '@/features/garden/components/water-due-card';
import { useGarden } from '@/features/garden/use-garden';
import { useGardenActions } from '@/features/garden/use-garden-actions';
import { gardenSummary, plantsNeedingWater } from '@/features/garden/watering';
import { useTheme } from '@/hooks/use-theme';
import { describeError } from '@/lib/auth/api-client';

export function GardenScreen() {
  const theme = useTheme();
  const { garden, error, isLoading, retry, refresh } = useGarden();
  const { waterPlants } = useGardenActions();
  const [isWatering, setIsWatering] = useState(false);
  const [waterError, setWaterError] = useState<string | null>(null);

  // Taken per render, so "today" moves on if the screen stays open past midnight.
  const now = new Date();
  const due = garden ? plantsNeedingWater(garden, now) : [];

  async function waterDuePlants() {
    setWaterError(null);
    setIsWatering(true);
    try {
      await waterPlants(due.map((plant) => plant.id));
      await refresh();
    } catch (err) {
      setWaterError(describeError(err));
    } finally {
      setIsWatering(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        {/* A tab, so no back button; plants are added with the tab bar's + button. */}
        <AppHeader />

        <ScrollView contentContainerClassName="w-full max-w-content grow gap-8 self-center px-6 pb-8 pt-2">
          {isLoading ? (
            // Colour props (spinner) read the theme instead of a class.
            <ActivityIndicator accessibilityLabel="Loading garden" color={theme.primary} className="mt-6" />
          ) : error ? (
            <View className="items-center gap-3">
              <Text className="type-body-medium text-error">{error}</Text>
              <Button label="Try again" variant="secondary" onPress={retry} />
            </View>
          ) : (
            garden &&
            (garden.rooms.length === 0 ? (
              <View className="items-center gap-2 rounded-2xl bg-background-element p-6">
                <Text className="type-subtitle-large text-text">Your garden is empty</Text>
                <Text className="type-body-medium text-center text-text-secondary">
                  Your rooms and plants will show up here.
                </Text>
              </View>
            ) : (
              <>
                <Text className="type-body-large text-text-secondary">{gardenSummary(garden)}</Text>
                {due.length > 0 && (
                  <WaterDueCard plants={due} onWater={waterDuePlants} loading={isWatering} error={waterError} />
                )}
                {garden.rooms.map((room) => (
                  <RoomSection key={room.id ?? 'unassigned'} room={room} now={now} />
                ))}
              </>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
