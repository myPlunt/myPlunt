import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { LinkCard } from '@/components/ui/link-card';
import { RoomSection } from '@/features/garden/components/room-section';
import { WaterDueCard } from '@/features/garden/components/water-due-card';
import { WaterSelectionBar } from '@/features/garden/components/water-selection-bar';
import { useGarden } from '@/features/garden/use-garden';
import { plantsNeedingWater } from '@/features/garden/watering';
import { queueWaterings } from '@/features/garden/watering-outbox';
import { OnboardingCard } from '@/features/onboarding/components/onboarding-card';
import { useTourBackLock } from '@/features/onboarding/use-tour-back-lock';
import { FriendGarden } from '@/features/plant-sitter/components/friend-garden';
import { GardenSwitch } from '@/features/plant-sitter/components/garden-switch';
import { useSitting } from '@/features/plant-sitter/use-sitting';
import { EditPlanterDialog } from '@/features/planters/components/edit-planter-dialog';
import { useTheme } from '@/hooks/use-theme';
import type { GardenPlant, Room } from '@/lib/garden/types';
import { useOnboardingStore } from '@/stores/onboarding-store';

export function GardenScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { garden, error, isLoading, retry, refresh } = useGarden();
  const { step, next, skipPast } = useOnboardingStore();
  const isPlantStep = step === 'plant';
  const isWaterStep = step === 'water';
  const isTourStep = isPlantStep || isWaterStep;
  useTourBackLock(isTourStep);
  const [isWatering, setIsWatering] = useState(false);
  // The plants picked to water; null when the user isn't picking.
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const stay = useSitting();
  const [showFriend, setShowFriend] = useState(false);

  const now = new Date();
  const due = garden ? plantsNeedingWater(garden, now) : [];
  const allPlants = garden ? garden.rooms.flatMap((room) => room.plants) : [];
  const allPlantIds = allPlants.map((plant) => plant.id);
  const hasPlants = allPlantIds.length > 0;
  const allSelected = selectedIds !== null && hasPlants && allPlantIds.every((id) => selectedIds.has(id));

  async function water(plants: GardenPlant[]) {
    setIsWatering(true);
    await queueWaterings(plants);
    if (isWaterStep) next();
    await refresh();
    setIsWatering(false);
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
    if (!selectedIds) return;
    await water(allPlants.filter((plant) => selectedIds.has(plant.id)));
    setSelectedIds(null);
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <AppHeader
          right={
            // Select all takes the water icon's spot (both h-10), so nothing moves when picking starts.
            selectedIds ? (
              <Button
                label={allSelected ? 'Deselect all' : 'Select all'}
                accessibilityLabel={`${allSelected ? 'Deselect' : 'Select'} all plants in the garden`}
                variant="ghost"
                onPress={() => selectMany(allPlantIds, !allSelected)}
              />
            ) : (
              hasPlants &&
              !(showFriend && stay) && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Water plants"
                  accessibilityHint="Pick the plants you watered"
                  onPress={() => setSelectedIds(new Set())}
                  className={`h-10 w-10 items-center justify-center rounded-full active:opacity-70 ${
                    isWaterStep ? 'border-2 border-primary' : ''
                  }`}>
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
          contentContainerClassName={`w-full max-w-content grow gap-8 self-center px-6 pt-2 ${isTourStep ? 'pb-72' : 'pb-8'}`}>
          {stay && !selectedIds && (
            <GardenSwitch friendName={stay.user.username} showFriend={showFriend} onChange={setShowFriend} />
          )}
          {showFriend && stay ? (
            <FriendGarden stay={stay} />
          ) : isLoading ? (
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
                  <WaterDueCard plants={due} onWater={() => water(due)} loading={isWatering} />
                )}
                {/* Plants don't open during the tour's steps, which would leave them; picking still works. */}
                <View className="gap-8" pointerEvents={isTourStep && !selectedIds ? 'none' : 'auto'}>
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
                {!selectedIds && !isTourStep && (
                  <LinkCard
                    title="Going away? Find a plant sitter"
                    icon={{ ios: 'key.fill', android: 'key', web: 'key' }}
                    onPress={() => router.push('/plant-sitter')}
                  />
                )}
              </>
            ))
          )}
        </ScrollView>

        {isWaterStep && (
          <View className={selectedIds ? 'px-3 pb-3' : 'absolute inset-x-3 bottom-3'}>
            <OnboardingCard
              step="water"
              title="Water your plants"
              body="When you've watered, tap the drop at the top, pick the plants you watered and tap Water. We'll remind you when they're thirsty again."
              actionLabel="Got it"
              onAction={next}
              showNotNow={false}
            />
          </View>
        )}

        {selectedIds && (
          <WaterSelectionBar
            selectedCount={selectedIds.size}
            onWater={waterSelected}
            onCancel={() => setSelectedIds(null)}
            loading={isWatering}
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
              // The later steps need the plant, so they're skipped too; they'd wait for a card that never shows.
              onSkip={() => skipPast('water')}
            />
          </View>
        )}


        {editingRoom?.id && (
          <EditPlanterDialog
            planter={{ id: editingRoom.id, name: editingRoom.name, plantCount: editingRoom.plants.length }}
            onClose={() => setEditingRoom(null)}
            onChanged={() => {
              setEditingRoom(null);
              refresh();
            }}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
