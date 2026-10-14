import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { SearchField } from '@/components/ui/search-field';
import { UserAvatar } from '@/components/user/user-avatar';
import { Shadow, type ThemeColor } from '@/constants/theme';
import { sendFriendRequest } from '@/features/friends/friends-service';
import { useUserSearch } from '@/features/friends/use-user-search';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, describeError } from '@/lib/auth/api-client';
import type { UserSummary } from '@/lib/user/types';
import { useAuthStore } from '@/stores/auth-store';

// Pills styled like WateringPill: the tone colour at low opacity behind text and icon in that colour.
// `icon` is a theme key because tintColor takes a colour, not a class.
const FRIENDSHIP_PILLS: Record<
  NonNullable<UserSummary['friendship']>,
  { label: string; symbol: SymbolViewProps['name']; pill: string; text: string; icon: ThemeColor }
> = {
  friends: {
    label: 'Friends',
    symbol: { ios: 'checkmark', android: 'check', web: 'check' },
    pill: 'bg-primary/15',
    text: 'text-primary',
    icon: 'primary',
  },
  request_sent: {
    label: 'Requested',
    symbol: { ios: 'clock', android: 'schedule', web: 'schedule' },
    pill: 'bg-text-secondary/10',
    text: 'text-text-secondary',
    icon: 'textSecondary',
  },
  request_received: {
    label: 'Wants to be friends',
    symbol: { ios: 'person.fill.badge.plus', android: 'person_add', web: 'person_add' },
    pill: 'bg-accent/15',
    text: 'text-accent',
    icon: 'accent',
  },
};

// Everything social except posts: people search now; Friends and Requests tabs join it later.
export function FriendsScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const { users, error, isLoading } = useUserSearch(query);
  // Requests sent from this screen; search results that loaded earlier don't know about them yet.
  const [sentIds, setSentIds] = useState<ReadonlySet<string>>(new Set());
  const hasResults = users !== null && users.length > 0;

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader showBack />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="w-full max-w-content grow gap-4 self-center px-6 pb-8 pt-2">
          <SearchField
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Search people"
            placeholder="Search by username"
            autoCapitalize="none"
          />

          {query.trim() === '' ? (
            <Text className="type-body-medium text-center text-text-secondary">Find friends by their username</Text>
          ) : error ? (
            <Text className="type-body-medium text-error">{error}</Text>
          ) : hasResults ? (
            // Results of the previous query stay, dimmed, while the next one loads.
            <View className={`gap-3 ${isLoading ? 'opacity-50' : ''}`}>
              {users.map((user) => (
                // ponytail: not tappable yet; opens the friend profile once that exists.
                <View
                  key={user.id}
                  className="flex-row items-center gap-3 rounded-2xl bg-background-element p-4"
                  style={Shadow.card}>
                  <UserAvatar size={44} url={user.avatarUrl} accessibilityLabel={`${user.username}'s profile picture`} />
                  <View className="flex-1 gap-1">
                    <Text className="type-subtitle-small text-text">{user.username}</Text>
                    {user.bio && (
                      <Text className="type-body-medium text-text-secondary" numberOfLines={2}>
                        {user.bio}
                      </Text>
                    )}
                  </View>
                  <FriendAction
                    user={sentIds.has(user.id) ? { ...user, friendship: 'request_sent' } : user}
                    onSent={() => setSentIds((ids) => new Set(ids).add(user.id))}
                  />
                </View>
              ))}
            </View>
          ) : isLoading ? (
            // Colour props (spinner, icons) read the theme instead of a class.
            <ActivityIndicator accessibilityLabel="Searching people" color={theme.primary} className="mt-4" />
          ) : (
            <Text className="type-body-medium text-center text-text-secondary">No one matches “{query.trim()}”</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Add for strangers; otherwise where the two stand. Answering a request comes with its own ticket.
function FriendAction({ user, onSent }: { user: UserSummary; onSent: () => void }) {
  const theme = useTheme();
  const { setUnauthenticated } = useAuthStore();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user.friendship) {
    const pill = FRIENDSHIP_PILLS[user.friendship];
    return (
      <View className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${pill.pill}`}>
        <SymbolView name={pill.symbol} tintColor={theme[pill.icon]} size={12} />
        <Text className={`type-body-medium ${pill.text}`}>{pill.label}</Text>
      </View>
    );
  }

  async function add() {
    setIsSending(true);
    setError(null);
    try {
      await sendFriendRequest(user.id);
      onSent();
    } catch (err) {
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

  return (
    <View className="max-w-[40%] items-end gap-1">
      <Button label="Add" accessibilityLabel={`Add ${user.username}`} loading={isSending} onPress={add} />
      {error && <Text className="type-caption text-right text-error">{error}</Text>}
    </View>
  );
}
