import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { acceptFriendRequest, declineFriendRequest } from '@/features/friends/friends-service';
import { ApiError, describeError } from '@/lib/auth/api-client';
import { useAuthStore } from '@/stores/auth-store';

type Answer = 'accepted' | 'declined';

interface FriendRequestActionsProps {
  /** The person who sent the request. */
  userId: string;
  onAnswered: (answer: Answer) => void;
}

/** Accept / Decline for a received friend request, on the Requests tab and on the sender's profile. */
export function FriendRequestActions({ userId, onAnswered }: FriendRequestActionsProps) {
  const { setUnauthenticated } = useAuthStore();
  const [answering, setAnswering] = useState<Answer | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function answer(choice: Answer) {
    setAnswering(choice);
    setError(null);
    try {
      await (choice === 'accepted' ? acceptFriendRequest(userId) : declineFriendRequest(userId));
      // Stays disabled: the request is gone, and the parent swaps these out once it has reloaded.
      onAnswered(choice);
    } catch (err) {
      setAnswering(null);
      // apiFetch already tried a refresh; a 401 here means the session is gone.
      if (err instanceof ApiError && err.status === 401) {
        setUnauthenticated();
        return;
      }
      setError(describeError(err));
    }
  }

  return (
    <View className="gap-2">
      <View className="flex-row gap-3">
        <Button
          label="Accept"
          loading={answering === 'accepted'}
          disabled={answering !== null}
          onPress={() => answer('accepted')}
        />
        <Button
          label="Decline"
          variant="secondary"
          loading={answering === 'declined'}
          disabled={answering !== null}
          onPress={() => answer('declined')}
        />
      </View>
      {error && <Text className="type-body-medium text-error">{error}</Text>}
    </View>
  );
}
