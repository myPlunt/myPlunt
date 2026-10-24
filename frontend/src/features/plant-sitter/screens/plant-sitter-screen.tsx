import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { PersonRow } from '@/features/friends/components/person-row';
import { useGarden } from '@/features/garden/use-garden';
import { useTheme } from '@/hooks/use-theme';

import { addDays, startOfDay, stayLabel } from '../away-trip';
import { AskSitterButton } from '../components/ask-sitter-button';
import { AwayCard } from '../components/away-card';
import { CareRequestActions } from '../components/care-request-actions';
import { groupSitters } from '../group-sitters';
import { useSitters } from '../use-sitters';

export function PlantSitterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { sitters, careRequests, error, retry, reload } = useSitters();
  const { garden } = useGarden();
  const liveRequest = careRequests?.sent[0];
  const [trip, setTrip] = useState(() => {
    const tomorrow = addDays(startOfDay(new Date()), 1);
    return { from: tomorrow, until: addDays(tomorrow, 6) };
  });

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader showBack />

        <ScrollView contentContainerClassName="w-full max-w-content grow gap-6 self-center px-6 pb-8 pt-2">
          <Text accessibilityRole="header" className="type-h3 text-action-primary" style={styles.title}>
            Plant sitter
          </Text>

          {careRequests && careRequests.received.length > 0 && (
            <View className="gap-3">
              <Text className="type-label uppercase text-accent">Asked of you</Text>
              {careRequests.received.map((request) => (
                <PersonRow
                  key={request.user.id}
                  user={request.user}
                  onPress={() => router.push({ pathname: '/user/[id]', params: { id: request.user.id } })}>
                  <Text className="type-body-medium text-text-secondary">
                    {request.status === 'active' ? "You're looking after" : 'Wants you to look after'} {request.plantCount}{' '}
                    {request.plantCount === 1 ? 'plant' : 'plants'} · {stayLabel(request.from, request.until)}
                  </Text>
                  {request.status === 'pending' && <CareRequestActions userId={request.user.id} onAnswered={reload} />}
                </PersonRow>
              ))}
            </View>
          )}

          <AwayCard
            from={trip.from}
            until={trip.until}
            plants={garden ? garden.rooms.flatMap((room) => room.plants) : null}
            onChange={(from, until) => setTrip({ from, until })}
          />

          {error ? (
            <View className="items-center gap-3">
              <Text className="type-body-medium text-error">{error}</Text>
              <Button label="Try again" variant="secondary" onPress={retry} />
            </View>
          ) : !sitters ? (
            <ActivityIndicator accessibilityLabel="Loading friends" color={theme.primary} className="mt-4" />
          ) : sitters.length === 0 ? (
            <View className="items-center gap-3">
              <Text className="type-body-medium text-center text-text-secondary">
                Add friends first, then they show up here.
              </Text>
              <Button label="Find friends" variant="secondary" onPress={() => router.push('/friends')} />
            </View>
          ) : (
            groupSitters(sitters).map((group) => (
              <View key={group.title} className="gap-3">
                <Text className="type-label uppercase text-accent">{group.title}</Text>
                {group.sitters.map((sitter) => (
                  <PersonRow
                    key={sitter.user.id}
                    user={sitter.user}
                    tag={sitter.distanceKm !== null ? `${sitter.distanceKm} km` : undefined}
                    onPress={() => router.push({ pathname: '/user/[id]', params: { id: sitter.user.id } })}>
                    <AskSitterButton
                      sitterId={sitter.user.id}
                      username={sitter.user.username}
                      from={trip.from}
                      until={trip.until}
                      sent={liveRequest?.user.id === sitter.user.id ? liveRequest : undefined}
                      askedSomeoneElse={
                        liveRequest && liveRequest.user.id !== sitter.user.id ? liveRequest.user.username : undefined
                      }
                      onChanged={reload}
                    />
                  </PersonRow>
                ))}
              </View>
            ))
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
