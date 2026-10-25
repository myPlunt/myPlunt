import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ApiError, describeError } from '@/lib/auth/api-client';
import { useAuthStore } from '@/stores/auth-store';

import { declineCareRequest } from '../plant-sitter-service';

interface StopSittingButtonProps {
  userId: string;
  username: string;
  onStopped: () => void;
}

export function StopSittingButton({ userId, username, onStopped }: StopSittingButtonProps) {
  const { setUnauthenticated } = useAuthStore();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function stop() {
    setIsStopping(true);
    setError(null);
    try {
      await declineCareRequest(userId);
      setIsConfirming(false);
      onStopped();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUnauthenticated();
        return;
      }
      setError(describeError(err));
    } finally {
      setIsStopping(false);
    }
  }

  return (
    <View className="flex-row">
      <Button
        label="Stop plant-sitting"
        accessibilityLabel={`Stop looking after ${username}'s plants`}
        variant="secondary"
        onPress={() => setIsConfirming(true)}
      />
      <ConfirmDialog
        visible={isConfirming}
        title="Stop plant-sitting?"
        message={`We'll let ${username} know you can't look after their plants anymore.`}
        confirmLabel="Stop"
        onConfirm={stop}
        onCancel={() => setIsConfirming(false)}
        loading={isStopping}
        error={error}
      />
    </View>
  );
}
