import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ApiError, describeError } from '@/lib/auth/api-client';
import type { CareRequest } from '@/lib/user/types';
import { useAuthStore } from '@/stores/auth-store';

import { addDays, stayLabel } from '../away-trip';
import { cancelCareRequest, sendCareRequest } from '../plant-sitter-service';

interface AskSitterButtonProps {
  sitterId: string;
  username: string;
  from: Date;
  until: Date;
  sent?: CareRequest;
  /** Who the user's one live request went to, when it's someone else. */
  askedSomeoneElse?: string;
  onChanged: () => void;
}

export function AskSitterButton({ sitterId, username, from, until, sent, askedSomeoneElse, onChanged }: AskSitterButtonProps) {
  const { setUnauthenticated } = useAuthStore();
  const [isBusy, setIsBusy] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setIsBusy(true);
    setError(null);
    try {
      await action();
      setIsConfirming(false);
      onChanged();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUnauthenticated();
        return;
      }
      setError(describeError(err));
    } finally {
      setIsBusy(false);
    }
  }

  if (sent) {
    const isActive = sent.status === 'active';
    return (
      <View className="gap-2">
        <Text className="type-body-medium text-text-secondary">
          {isActive ? 'Looking after your plants' : 'Waiting for an answer'} · {stayLabel(sent.from, sent.until)}
        </Text>
        <View className="flex-row">
          <Button
            label="Cancel request"
            accessibilityLabel={`Cancel your request to ${username}`}
            variant="secondary"
            onPress={() => setIsConfirming(true)}
          />
        </View>
        {error && !isConfirming && <Text className="type-body-medium text-error">{error}</Text>}
        <ConfirmDialog
          visible={isConfirming}
          title="Cancel request?"
          message={
            isActive
              ? `${username} already said yes. We'll let them know you don't need a plant sitter anymore.`
              : `We'll let ${username} know you don't need a plant sitter anymore.`
          }
          confirmLabel="Cancel request"
          onConfirm={() => run(() => cancelCareRequest(sitterId))}
          onCancel={() => setIsConfirming(false)}
          loading={isBusy}
          error={error}
        />
      </View>
    );
  }

  return (
    <View className="gap-2">
      <Button
        label="Ask to plant-sit"
        accessibilityLabel={`Ask ${username} to plant-sit`}
        loading={isBusy}
        disabled={askedSomeoneElse !== undefined}
        onPress={() => run(() => sendCareRequest(sitterId, from, addDays(until, 1)))}
      />
      {askedSomeoneElse && (
        <Text className="type-caption text-text-secondary">
          You already asked {askedSomeoneElse}. Cancel that request to ask someone else.
        </Text>
      )}
      {error && <Text className="type-body-medium text-error">{error}</Text>}
    </View>
  );
}
