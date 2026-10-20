import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { RoomSection } from '@/features/garden/components/room-section';
import { WaterDueCard } from '@/features/garden/components/water-due-card';
import { WaterSelectionBar } from '@/features/garden/components/water-selection-bar';
import { useGarden } from '@/features/garden/use-garden';
import { useGardenActions } from '@/features/garden/use-garden-actions';
import { plantsNeedingWater } from '@/features/garden/watering';
import { OnboardingCard } from '@/features/onboarding/components/onboarding-card';
import { useTourBackLock } from '@/features/onboarding/use-tour-back-lock';
import { EditPlanterDialog } from '@/features/planters/components/edit-planter-dialog';
import { useTheme } from '@/hooks/use-theme';
import { describeError } from '@/lib/auth/api-client';
import type { Room } from '@/lib/garden/types';
import { logFailedUi } from '@/lib/logger';
import { useOnboardingStore } from '@/stores/onboarding-store';

export function GardenScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { garden, error, isLoading, retry, refresh } = useGarden();
  // The tour's first-plant step: its card opens the Add sheet, and saving a plant there ends
  // the step (AddPlantScreen).
  const { step, next } = useOnboardingStore();
  const isPlantStep = step === 'plant';
  useTourBackLock(isPlantStep);
  const { waterPlants } = useGardenActions();
  const [isWatering, setIsWatering] = useState(false);
  const [waterError, setWaterError] = useState<string | null>(null);
  // The plants picked to water; null when the user isn't picking.
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null);
  // The planter whose rename/delete dialog is open.
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Taken per render, so "today" moves on if the screen stays open past midnight.
  const now = new Date();
  const due = garden ? plantsNeedingWater(garden, now) : [];
  const allPlantIds = garden ? garden.rooms.flatMap((room) => room.plants.map((plant) => plant.id)) : [];
  const hasPlants = allPlantIds.length > 0;
  const allSelected = selectedIds !== null && hasPlants && allPlantIds.every((id) => selectedIds.has(id));

  /** Resolves to whether watering worked; on failure the error is shown and nothing is refreshed. */
  async function water(plantIds: string[]) {
    setWaterError(null);
    setIsWatering(true);
    try {
      await waterPlants(plantIds);
      await refresh();
      return true;
    } catch (err) {
      logFailedUi('watering_failed_ui', err, { plant_count: plantIds.length });
      setWaterError(describeError(err));
      return false;
    } finally {
      setIsWatering(false);
    }
  }

  function startSelecting() {
    setWaterError(null);
    setSelectedIds(new Set());
  }

  function selectMany(plantIds: string[], selected: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const plantId of plantIds) {
        if (selected) {
          next.add(plantId);
        } else {
          next.delete(plantId);
        }
      }
      return next;
    });
  }

  function toggleSelected(plantId: string) {
    selectMany([plantId], !selectedIds?.has(plantId));
  }

  async function waterSelected() {
    // Stays in selection mode on failure, so the user can retry without picking again.
    if (selectedIds && (await water([...selectedIds]))) {
      setSelectedIds(null);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        {/* A tab, so no back button; plants are added with the tab bar's + button. */}
        <AppHeader
          right={
            // While picking plants, Select all takes the water icon's spot (both are h-10),
            // so nothing on the page moves when selection mode starts.
            selectedIds ? (
              <Button
                label={allSelected ? 'Deselect all' : 'Select all'}
                accessibilityLabel={`${allSelected ? 'Deselect' : 'Select'} all plants in the garden`}
                variant="ghost"
                onPress={() => selectMany(allPlantIds, !allSelected)}
              />
            ) : (
              hasPlants && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Water plants"
                  accessibilityHint="Pick the plants you watered"
                  onPress={startSelecting}
                  className="h-10 w-10 items-center justify-center active:opacity-70">
                  {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
                  <SymbolView
                    name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
                    tintColor={theme.water}
                    size={22}
                  />
                </Pressable>
              )
            )
          }
        />

        <ScrollView
          // Room to scroll the garden out from under the tour card.
          contentContainerClassName={`w-full max-w-content grow gap-8 self-center px-6 pt-2 ${isPlantStep ? 'pb-72' : 'pb-8'}`}>
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
                {/* Hidden while picking plants, so there's only one Water button on screen. */}
                {due.length > 0 && !selectedIds && (
                  <WaterDueCard
                    plants={due}
                    onWater={() => water(due.map((plant) => plant.id))}
                    loading={isWatering}
                    error={waterError}
                  />
                )}
                {/* The plants don't open during the tour's step, which would leave it. */}
                <View className="gap-8" pointerEvents={isPlantStep ? 'none' : 'auto'}>
                  {garden.rooms.map((room) => (
                    <RoomSection
                      key={room.id ?? 'unassigned'}
                      room={room}
                      now={now}
                      selection={
                        selectedIds ? { selectedIds, onToggle: toggleSelected, onSelectMany: selectMany } : undefined
                      }
                      onEdit={room.id !== null ? () => setEditingRoom(room) : undefined}
                    />
                  ))}
                </View>
              </>
            ))
          )}
        </ScrollView>

        {selectedIds && (
          <WaterSelectionBar
            selectedCount={selectedIds.size}
            onWater={waterSelected}
            onCancel={() => setSelectedIds(null)}
            loading={isWatering}
            error={waterError}
          />
        )}

        {isPlantStep && (
          <View className="absolute inset-x-3 bottom-3">
            <OnboardingCard
              step="plant"
              title="Plant your first plant"
              body="Add a plant you have at home, here or with the + below: where it stands and how often it likes water. We'll remind you when it's thirsty."
              actionLabel="Add a plant"
              onAction={() => router.push('/add')}
              // The photo step after this one is on the new plant's page, so without a plant
              // it's skipped too; otherwise it'd wait for a card that never shows.
              onSkip={next}
            />
          </View>
        )}

        {editingRoom?.id && (
          <EditPlanterDialog
            planter={{ id: editingRoom.id, name: editingRoom.name, plantCount: editingRoom.plants.length }}
            onClose={() => setEditingRoom(null)}
            onChanged={() => {
              setEditingRoom(null);
              // A deleted planter's plants now show up under "Other plants".
              refresh();
            }}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
