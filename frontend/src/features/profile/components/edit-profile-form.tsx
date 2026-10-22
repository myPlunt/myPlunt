import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { useProfileActions } from '@/features/profile/use-profile-actions';
import { ApiError, describeError } from '@/lib/auth/api-client';
import { logFailedUi } from '@/lib/logger';
import type { User } from '@/lib/user/types';

const BIO_MAX_LENGTH = 255;

export function EditProfileForm({ user, onSaved }: { user: User; onSaved?: () => void }) {
  const { updateProfile } = useProfileActions();
  // The last saved values: what "changed" is measured against.
  const [saved, setSaved] = useState(user);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio ?? '');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const hasChanges = username !== saved.username || bio !== (saved.bio ?? '');

  async function handleSave() {
    setError(null);
    setFieldErrors({});
    setJustSaved(false);
    setIsSubmitting(true);
    try {
      const updated = await updateProfile({ username, bio: bio.trim() === '' ? null : bio });
      setSaved(updated);
      setUsername(updated.username);
      setBio(updated.bio ?? '');
      setJustSaved(true);
      onSaved?.();
    } catch (err) {
      logFailedUi('profile_update_failed_ui', err);
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
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
        label="Username"
        value={username}
        onChangeText={setUsername}
        error={fieldErrors.username}
        textContentType="username"
      />
      <FormField
        label="Bio"
        value={bio}
        onChangeText={setBio}
        error={fieldErrors.bio}
        helperText={`${bio.length}/${BIO_MAX_LENGTH}`}
        placeholder="Tell other plant lovers about yourself"
        maxLength={BIO_MAX_LENGTH}
        multiline
        autoCapitalize="sentences"
        autoCorrect
      />

      {error && <Text className="type-body-medium text-error">{error}</Text>}
      {justSaved && !hasChanges && <Text className="type-body-medium text-primary">Profile saved</Text>}

      <View className="mt-4">
        <Button
          label="Save changes"
          size="large"
          loading={isSubmitting}
          disabled={!hasChanges}
          onPress={handleSave}
        />
      </View>
    </View>
  );
}
