import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user/user-avatar';
import { FriendRequestActions } from '@/features/friends/components/friend-request-actions';
import { cancelFriendRequest, sendFriendRequest } from '@/features/friends/friends-service';
import { useUserProfile } from '@/features/friends/use-user-profile';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, describeError } from '@/lib/auth/api-client';
import { logFailedUi } from '@/lib/logger';
import type { UserSummary } from '@/lib/user/types';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Another user's profile, opened from the Friends search: who they are and where the two of you
 * stand. Their garden joins it with the friend profile ticket.
 */
export function UserProfileScreen({ userId }: { userId: string }) {
  const theme = useTheme();
  const { user, error, isLoading, retry } = useUserProfile(userId);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <AppHeader showBack />

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
              <View className="items-center gap-1">
                <UserAvatar size={96} url={user.avatarUrl} accessibilityLabel={`${user.username}'s profile picture`} />
                <Text accessibilityRole="header" className="type-h4 text-text">
                  {user.username}
                </Text>
                {user.bio && <Text className="type-body-large mt-3 text-center text-text">{user.bio}</Text>}
                <View className="mt-4 items-center">
                  <FriendshipAction user={user} />
                </View>
              </View>
            )
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Add friend for strangers, Cancel request for someone you asked, Accept / Decline for someone who
// asked you; otherwise where the two stand. Removing a friend comes with its own ticket.
function FriendshipAction({ user }: { user: UserSummary }) {
  const { setUnauthenticated } = useAuthStore();
  // Set by answering, adding or cancelling here (undefined until then); the loaded value only reloads on focus.
  const [changed, setChanged] = useState<UserSummary['friendship'] | undefined>(undefined);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const friendship = changed === undefined ? user.friendship : changed;

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
      return <Button label="Friends" variant="secondary" disabled />;
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
