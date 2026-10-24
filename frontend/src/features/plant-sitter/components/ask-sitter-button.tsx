import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ApiError, describeError } from '@/lib/auth/api-client';
import type { CareRequest } from '@/lib/user/types';
import { useAuthStore } from '@/stores/auth-store';

import { addDays, stayLabel } from '../away-trip';
import { sendCareRequest } from '../plant-sitter-service';

interface AskSitterButtonProps {
  sitterId: string;
  username: string;
  from: Date;
  until: Date;
  sent?: CareRequest;
  onSent: () => void;
}

export function AskSitterButton({ sitterId, username, from, until, sent, onSent }: AskSitterButtonProps) {
  const { setUnauthenticated } = useAuthStore();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sent) {
    return (
      <Text className="type-body-medium text-text-secondary">
        {sent.status === 'active' ? 'Looking after your plants' : 'Waiting for an answer'} · {stayLabel(sent.from, sent.until)}
      </Text>
    );
  }

  async function ask() {
    setIsSending(true);
    setError(null);
    try {
      await sendCareRequest(sitterId, from, addDays(until, 1));
      onSent();
    } catch (err) {
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
    <View className="gap-2">
      <Button
        label="Ask to plant-sit"
        accessibilityLabel={`Ask ${username} to plant-sit`}
        loading={isSending}
        onPress={ask}
      />
      {error && <Text className="type-body-medium text-error">{error}</Text>}
    </View>
  );
}
