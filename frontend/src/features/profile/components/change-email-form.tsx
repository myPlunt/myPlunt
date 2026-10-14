import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { useProfileActions } from '@/features/profile/use-profile-actions';
import { ApiError, describeError } from '@/lib/auth/api-client';
import { logFailedUi } from '@/lib/logger';
import type { User } from '@/lib/user/types';

/** Changes the email. The backend always asks for the current password. */
export function ChangeEmailForm({ user }: { user: User }) {
  const { changeEmail } = useProfileActions();
  const [savedEmail, setSavedEmail] = useState(user.email);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const emailChanged = email.trim() !== savedEmail;

  async function handleSave() {
    setError(null);
    setFieldErrors({});
    setJustSaved(false);
    setIsSubmitting(true);
    try {
      const updated = await changeEmail({ email: email.trim(), currentPassword });
      setSavedEmail(updated.email);
      setEmail(updated.email);
      setCurrentPassword('');
      setJustSaved(true);
    } catch (err) {
      logFailedUi('email_change_failed_ui', err);
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else if (err instanceof ApiError && err.status === 403) {
        // The backend's only 403 here is a wrong current password.
        setFieldErrors({ currentPassword: describeError(err) });
      } else {
        setError(describeError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="gap-1">
      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      {emailChanged && (
        <FormField
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          error={fieldErrors.currentPassword}
          helperText="Needed to change your email."
          secureTextEntry
          textContentType="password"
        />
      )}

      {error && <Text className="type-body-medium text-error">{error}</Text>}
      {justSaved && !emailChanged && <Text className="type-body-medium text-primary">Email changed</Text>}

      {emailChanged && (
        <View className="mt-4">
          <Button
            label="Change email"
            size="large"
            loading={isSubmitting}
            disabled={currentPassword === ''}
            onPress={handleSave}
          />
        </View>
      )}
    </View>
  );
}
