import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Shadow } from '@/constants/theme';
import { useAuthActions } from '@/features/auth/use-auth-actions';
import { ApiError, describeError } from '@/lib/auth/api-client';
import { logAction, logFailedUi } from '@/lib/logger';

/** Asks for the password so an unlocked phone in someone else's hands can't wipe the account. */
export function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const { deleteAccount } = useAuthActions();
  const [currentPassword, setCurrentPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  function close() {
    if (isBusy) return;
    logAction('account_delete_cancelled');
    onClose();
  }

  async function confirm() {
    setPasswordError(null);
    setError(null);
    setIsBusy(true);
    try {
      // On success the session ends and the app leaves this screen, so there's nothing to reset.
      await deleteAccount({ currentPassword });
    } catch (err) {
      logFailedUi('account_delete_failed_ui', err);
      setIsBusy(false);
      if (err instanceof ApiError && err.status === 401) return;
      // The backend's only 403 here is a wrong current password.
      if (err instanceof ApiError && err.status === 403) {
        setPasswordError(describeError(err));
      } else {
        setError(describeError(err));
      }
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        // style, not className: a flex-1 class overrides the height Android's "height" behavior sets.
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="flex-1 items-center justify-center px-6">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={close}
            className="absolute inset-0 bg-text opacity-40"
          />
          <View className="w-full max-w-[360px] gap-3 rounded-2xl bg-background-element p-5" style={Shadow.card}>
            <Text accessibilityRole="header" className="type-subtitle-large text-text">
              Delete your account?
            </Text>
            <Text className="type-body-medium text-text-secondary">
              Your garden, plants, photos, posts, comments, friends and notifications are deleted for good. Friends
              lose what you shared with them too. This can&apos;t be undone.
            </Text>
            <FormField
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              error={passwordError ?? undefined}
              helperText="Needed to delete your account."
              secureTextEntry
              textContentType="password"
            />
            {error && <Text className="type-body-medium text-error">{error}</Text>}
            <View className="mt-2 flex-row justify-center gap-3">
              <Button
                label="Cancel"
                variant="secondary"
                disabled={isBusy}
                style={{ borderWidth: 0 }}
                onPress={close}
              />
              <Button
                label="Delete account"
                variant="destructive"
                loading={isBusy}
                disabled={currentPassword === ''}
                onPress={confirm}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
