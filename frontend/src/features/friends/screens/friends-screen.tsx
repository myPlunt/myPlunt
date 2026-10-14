import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { SearchField } from '@/components/ui/search-field';
import { FriendRequestActions } from '@/features/friends/components/friend-request-actions';
import { FriendsTabs, type FriendsTab } from '@/features/friends/components/friends-tabs';
import { PersonRow } from '@/features/friends/components/person-row';
import { useFriends } from '@/features/friends/use-friends';
import { useUserSearch } from '@/features/friends/use-user-search';
import { useTheme } from '@/hooks/use-theme';

// Everything social except posts: finding people, your friends, and requests to answer.
export function FriendsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<FriendsTab>('find');
  // Kept here, so switching tabs and back doesn't clear the search.
  const [query, setQuery] = useState('');
  // Loaded whatever the tab, so the Requests badge shows from the start.
  const friends = useFriends();

  function openProfile(id: string) {
    router.push({ pathname: '/user/[id]', params: { id } });
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader showBack />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="w-full max-w-content grow gap-4 self-center px-6 pb-8 pt-2">
          <FriendsTabs tab={tab} onChange={setTab} requestCount={friends.requests?.received.length ?? 0} />

          {tab === 'find' ? (
            <FindTab query={query} onChangeQuery={setQuery} openProfile={openProfile} />
          ) : friends.error ? (
            <View className="items-center gap-3">
              <Text className="type-body-medium text-error">{friends.error}</Text>
              <Button label="Try again" variant="secondary" onPress={friends.retry} />
            </View>
          ) : !friends.friends || !friends.requests ? (
            <Loading label={tab === 'friends' ? 'Loading friends' : 'Loading requests'} />
          ) : tab === 'friends' ? (
            friends.friends.length === 0 ? (
              <EmptyText>No friends yet. Find people in the Find tab.</EmptyText>
            ) : (
              friends.friends.map((user) => (
                <PersonRow key={user.id} user={user} onPress={() => openProfile(user.id)} />
              ))
            )
          ) : friends.requests.received.length === 0 && friends.requests.sent.length === 0 ? (
            <EmptyText>No friend requests</EmptyText>
          ) : (
            <>
              {friends.requests.received.length > 0 && (
                <View className="gap-3">
                  <Text className="type-label text-accent">RECEIVED</Text>
                  {friends.requests.received.map((user) => (
                    <PersonRow key={user.id} user={user} onPress={() => openProfile(user.id)}>
                      {/* Reloads both lists, so someone accepted moves to Friends. */}
                      <FriendRequestActions userId={user.id} onAnswered={friends.reload} />
                    </PersonRow>
                  ))}
                </View>
              )}
              {friends.requests.sent.length > 0 && (
                <View className="gap-3">
                  <Text className="type-label text-accent">SENT</Text>
                  {friends.requests.sent.map((user) => (
                    <PersonRow key={user.id} user={user} tag="Requested" onPress={() => openProfile(user.id)} />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

interface FindTabProps {
  query: string;
  onChangeQuery: (query: string) => void;
  openProfile: (id: string) => void;
}

function FindTab({ query, onChangeQuery, openProfile }: FindTabProps) {
  const { users, error, isLoading } = useUserSearch(query);
  const hasResults = users !== null && users.length > 0;

  return (
    <>
      <SearchField
        value={query}
        onChangeText={onChangeQuery}
        accessibilityLabel="Search people"
        placeholder="Search by username"
        autoCapitalize="none"
      />

      {query.trim() === '' ? (
        <EmptyText>Find friends by their username</EmptyText>
      ) : error ? (
        <Text className="type-body-medium text-error">{error}</Text>
      ) : hasResults ? (
        // Results of the previous query stay, dimmed, while the next one loads.
        <View className={`gap-3 ${isLoading ? 'opacity-50' : ''}`}>
          {users.map((user) => (
            // Their profile shows whether either of you asked, and lets you add them.
            <PersonRow
              key={user.id}
              user={user}
              tag={user.friendship === 'friends' ? 'Friend' : undefined}
              onPress={() => openProfile(user.id)}
            />
          ))}
        </View>
      ) : isLoading ? (
        <Loading label="Searching people" />
      ) : (
        <EmptyText>No one matches “{query.trim()}”</EmptyText>
      )}
    </>
  );
}

function Loading({ label }: { label: string }) {
  const theme = useTheme();
  // A colour prop, so it reads the theme instead of a class.
  return <ActivityIndicator accessibilityLabel={label} color={theme.primary} className="mt-4" />;
}

function EmptyText({ children }: { children: ReactNode }) {
  return <Text className="type-body-medium text-center text-text-secondary">{children}</Text>;
}
