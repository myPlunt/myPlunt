import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tabs } from '@/components/ui/tabs';
import { UserAvatar } from '@/components/user/user-avatar';
import { FriendRequestActions } from '@/features/friends/components/friend-request-actions';
import { cancelFriendRequest, removeFriend, sendFriendRequest } from '@/features/friends/friends-service';
import { useUserProfile } from '@/features/friends/use-user-profile';
import { RoomSection } from '@/features/garden/components/room-section';
import { useGarden } from '@/features/garden/use-garden';
import { SpeciesCard } from '@/features/pluntdex/components/species-card';
import { ProfileStats } from '@/features/profile/components/profile-stats';
import { profileStats } from '@/features/profile/profile-stats';
import { useDiscoveredSpecies } from '@/features/species/use-discovered-species';
import { useSpecies } from '@/features/species/use-species';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, describeError } from '@/lib/auth/api-client';
import type { Room } from '@/lib/garden/types';
import { logFailedUi } from '@/lib/logger';
import type { Species } from '@/lib/species/types';
import type { UserSummary } from '@/lib/user/types';
import { useAuthStore } from '@/stores/auth-store';

type Friendship = UserSummary['friendship'];

/**
 * Another user's profile, opened from the Friends screen: who they are and where the two of you
 * stand. A friend's also shows their stats, garden and PluntDex.
 */
export function UserProfileScreen({ userId }: { userId: string }) {
  const theme = useTheme();
  const { user, error, isLoading, retry } = useUserProfile(userId);
  // Set by answering, adding, cancelling or removing here (undefined until then); the loaded value only reloads on focus.
  const [changed, setChanged] = useState<Friendship | undefined>(undefined);
  const friendship = changed === undefined ? user?.friendship : changed;
  const header = user && <ProfileHeader user={user} friendship={friendship ?? null} onChange={setChanged} />;

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader showBack />

        {user && !isLoading && !error && friendship === 'friends' ? (
          <FriendContent user={user} header={header} />
        ) : (
          <ScrollView contentContainerClassName="w-full max-w-content grow gap-6 self-center p-6">
            {isLoading ? (
              // A colour prop, so it reads the theme instead of a class.
              <ActivityIndicator accessibilityLabel="Loading profile" color={theme.primary} className="mt-6" />
            ) : error ? (
              <View className="items-center gap-3">
                <Text className="type-body-medium text-error">{error}</Text>
                <Button label="Try again" variant="secondary" onPress={retry} />
              </View>
            ) : (
              user && (
                <>
                  {header}
                  <FriendsOnly />
                </>
              )
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

function ProfileHeader({
  user,
  friendship,
  onChange,
}: {
  user: UserSummary;
  friendship: Friendship;
  onChange: (friendship: Friendship) => void;
}) {
  return (
    <View className="items-center gap-1">
      <UserAvatar size={96} url={user.avatarUrl} accessibilityLabel={`${user.username}'s profile picture`} />
      <Text accessibilityRole="header" className="type-h4 text-text">
        {user.username}
      </Text>
      {user.bio && <Text className="type-body-large mt-3 text-center text-text">{user.bio}</Text>}
      <View className="mt-4 items-center">
        <FriendshipAction user={user} friendship={friendship} onChange={onChange} />
      </View>
    </View>
  );
}

// In place of the stats and tabs: the backend only sends a garden to friends.
function FriendsOnly() {
  const theme = useTheme();
  return (
    <View className="items-center gap-2 rounded-3xl border-[1.5px] border-dashed border-input-border p-8">
      {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
      <SymbolView name={{ ios: 'lock', android: 'lock', web: 'lock' }} tintColor={theme.accentMuted} size={32} />
      <Text className="type-subtitle-large text-center text-text">Only friends can see this garden</Text>
      <Text className="type-body-medium text-center text-text-secondary">
        Once you&apos;re friends, their stats, garden and PluntDex show up here.
      </Text>
    </View>
  );
}

type FriendTab = 'garden' | 'pluntdex';

// One list for the whole screen (header, stats, tabs, then rooms or rows of two species), so the
// rooms and species cards are virtualised and nothing nests a list in a ScrollView.
type Row = { key: string; room: Room } | { key: string; species: Species[] };

function FriendContent({ user, header }: { user: UserSummary; header: ReactNode }) {
  const theme = useTheme();
  const router = useRouter();
  const garden = useGarden(user.id);
  const discovered = useDiscoveredSpecies(user.id);
  const species = useSpecies();
  const [tab, setTab] = useState<FriendTab>('garden');

  // Taken per render, so "today" moves on if the screen stays open past midnight.
  const now = new Date();
  const stats =
    garden.garden && discovered.discovered && species.species
      ? profileStats(garden.garden, discovered.discovered, species.species)
      : null;
  const discoveredIds = new Set(discovered.discovered?.map((d) => d.speciesId));
  // Numbered by place in the full list, like the PluntDex tab.
  const numbers = new Map(species.species?.map((s, i) => [s.id, String(i + 1).padStart(3, '0')]));

  const error = tab === 'garden' ? garden.error : (species.error ?? discovered.error);
  // Loads again whichever failed.
  function retry() {
    if (tab === 'garden') {
      garden.retry();
      return;
    }
    if (species.error) species.retry();
    if (discovered.error) discovered.retry();
  }

  const rows: Row[] = [];
  if (!error && tab === 'garden' && garden.garden) {
    for (const room of garden.garden.rooms) rows.push({ key: room.id ?? 'other', room });
  }
  if (!error && tab === 'pluntdex' && species.species && discovered.discovered) {
    const all = species.species;
    for (let i = 0; i < all.length; i += 2) rows.push({ key: all[i].id, species: all.slice(i, i + 2) });
  }
  const isLoading = !error && rows.length === 0 && (tab === 'garden' ? !garden.garden : !species.species || !discovered.discovered);

  return (
    <FlatList
      data={rows}
      keyExtractor={(row) => row.key}
      contentContainerClassName="w-full max-w-content grow gap-6 self-center p-6"
      ListHeaderComponent={
        <View className="gap-6">
          {header}
          <ProfileStats stats={stats} onOpenGarden={() => setTab('garden')} onOpenPluntdex={() => setTab('pluntdex')} />
          <View className="gap-3">
            <Tabs
              tabs={[
                { value: 'garden', label: 'Garden' },
                { value: 'pluntdex', label: 'PluntDex' },
              ]}
              value={tab}
              onChange={setTab}
            />
            {tab === 'pluntdex' && !error && (
              <Text className="type-body-medium text-text-secondary">
                Ticked: the species {user.username} has discovered.
              </Text>
            )}
          </View>
        </View>
      }
      ListFooterComponent={
        error ? (
          <View className="items-center gap-3">
            <Text className="type-body-medium text-error">{error}</Text>
            <Button label="Try again" variant="secondary" onPress={retry} />
          </View>
        ) : isLoading ? (
          // A colour prop, so it reads the theme instead of a class.
          <ActivityIndicator
            accessibilityLabel={tab === 'garden' ? 'Loading garden' : 'Loading PluntDex'}
            color={theme.primary}
          />
        ) : tab === 'garden' && rows.length === 0 ? (
          <Text className="type-body-medium text-center text-text-secondary">
            {user.username} hasn&apos;t added any plants yet.
          </Text>
        ) : null
      }
      renderItem={({ item: row }) =>
        'room' in row ? (
          <RoomSection room={row.room} now={now} readOnly />
        ) : (
          <View className="flex-row justify-between">
            {row.species.map((s) => (
              <SpeciesCard
                key={s.id}
                species={s}
                number={numbers.get(s.id) ?? ''}
                discovered={discoveredIds.has(s.id)}
                onPress={() => router.push({ pathname: '/species/[id]', params: { id: s.id } })}
              />
            ))}
          </View>
        )
      }
    />
  );
}

// Add friend for strangers, Cancel request for someone you asked, Accept / Decline for someone who
// asked you, and Friends (tap to remove) for a friend.
function FriendshipAction({
  user,
  friendship,
  onChange: setChanged,
}: {
  user: UserSummary;
  friendship: Friendship;
  onChange: (friendship: Friendship) => void;
}) {
  const { setUnauthenticated } = useAuthStore();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sends or takes back the request; cancelling deletes it, so they're back to someone you can add.
  async function send(cancel: boolean) {
    setIsSending(true);
    setError(null);
    try {
      await (cancel ? cancelFriendRequest(user.id) : sendFriendRequest(user.id));
      setChanged(cancel ? null : 'request_sent');
    } catch (err) {
      logFailedUi('friend_request_failed_ui', err);
      // apiFetch already tried a refresh; a 401 here means the session is gone.
      if (err instanceof ApiError && err.status === 401) {
        setUnauthenticated();
        return;
      }
      setError(describeError(err));
    } finally {
      setIsSending(false);
    }
  }

  switch (friendship) {
    case 'friends':
      // Removing deletes the friendship, so they're back to someone you can add.
      return <RemoveFriend user={user} onRemoved={() => setChanged(null)} />;
    case 'request_sent':
      return (
        <View className="items-center gap-2">
          <Button label="Cancel request" variant="secondary" loading={isSending} onPress={() => send(true)} />
          {error && <Text className="type-body-medium text-center text-error">{error}</Text>}
        </View>
      );
    case 'request_received':
      return (
        <View className="items-center gap-3">
          <Text className="type-body-medium text-center text-text-secondary">
            {user.username} sent you a friend request
          </Text>
          <FriendRequestActions
            userId={user.id}
            // Declining deletes the request, so they're back to someone you can add.
            onAnswered={(answer) => setChanged(answer === 'accepted' ? 'friends' : null)}
          />
        </View>
      );
    default:
      return (
        <View className="items-center gap-2">
          <Button label="Add friend" loading={isSending} onPress={() => send(false)} />
          {error && <Text className="type-body-medium text-center text-error">{error}</Text>}
        </View>
      );
  }
}

// The Friends button: tapping it asks before ending the friendship.
function RemoveFriend({ user, onRemoved }: { user: UserSummary; onRemoved: () => void }) {
  const { setUnauthenticated } = useAuthStore();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setIsRemoving(true);
    setError(null);
    try {
      await removeFriend(user.id);
      // Swaps this button (and its popup) for Add friend.
      onRemoved();
    } catch (err) {
      setIsRemoving(false);
      logFailedUi('friend_remove_failed_ui', err);
      // apiFetch already tried a refresh; a 401 here means the session is gone.
      if (err instanceof ApiError && err.status === 401) {
        setUnauthenticated();
        return;
      }
      setError(describeError(err));
    }
  }

  return (
    <>
      <Button
        label="Friends"
        variant="secondary"
        accessibilityHint="Asks before removing them as a friend"
        onPress={() => setIsConfirming(true)}
      />
      <ConfirmDialog
        visible={isConfirming}
        title={`Remove ${user.username} as a friend?`}
        message="To be friends again, one of you will have to send a new request."
        confirmLabel="Remove"
        onConfirm={remove}
        onCancel={() => {
          setIsConfirming(false);
          setError(null);
        }}
        loading={isRemoving}
        error={error}
      />
    </>
  );
}
