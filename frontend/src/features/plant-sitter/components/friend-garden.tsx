import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { RoomSection } from '@/features/garden/components/room-section';
import { WaterDueCard } from '@/features/garden/components/water-due-card';
import { useGarden } from '@/features/garden/use-garden';
import { plantsNeedingWater } from '@/features/garden/watering';
import { queueWaterings, sendWaterings } from '@/features/garden/watering-outbox';
import { useTheme } from '@/hooks/use-theme';
import type { CareRequest } from '@/lib/user/types';

import { addDays } from '../away-trip';

export function FriendGarden({ stay }: { stay: CareRequest }) {
  const theme = useTheme();
  const { garden, error, retry, refresh } = useGarden(stay.user.id);
  const [isWatering, setIsWatering] = useState(false);
  const now = new Date();
  const due = garden ? plantsNeedingWater(garden, now) : [];

  // Through the same outbox as the user's own plants, so a watering without connection is sent later.
  async function water() {
    setIsWatering(true);
    await queueWaterings(due);
    await sendWaterings();
    await refresh();
    setIsWatering(false);
  }
  const lastDay = addDays(new Date(stay.until), -1).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <>
      <View className="rounded-2xl bg-primary/15 px-4 py-3">
        <Text className="type-body-medium text-text">
          You&apos;re looking after {stay.user.username}&apos;s plants until {lastDay}. You can water them, not change them.
        </Text>
      </View>
      {error ? (
        <View className="items-center gap-3">
          <Text className="type-body-medium text-error">{error}</Text>
          <Button label="Try again" variant="secondary" onPress={retry} />
        </View>
      ) : !garden ? (
        <ActivityIndicator accessibilityLabel={`Loading ${stay.user.username}'s garden`} color={theme.primary} />
      ) : (
        <>
          {due.length > 0 && <WaterDueCard plants={due} onWater={water} loading={isWatering} />}
          {garden.rooms.map((room) => (
            <RoomSection key={room.id ?? 'unassigned'} room={room} now={now} ownerId={stay.user.id} />
          ))}
        </>
      )}
    </>
  );
}
