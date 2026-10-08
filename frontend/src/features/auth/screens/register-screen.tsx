import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing, Typography } from '@/constants/theme';
import { AuthScreenLayout } from '@/features/auth/components/auth-screen-layout';
import { FormField } from '@/features/auth/components/form-field';
import { useAuthActions } from '@/features/auth/use-auth-actions';
import { describeError } from '@/lib/auth/api-client';

export function RegisterScreen() {
  const { register } = useAuthActions();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await register({ username, email, password });
    } catch (err) {
      setError(
        describeError(err, {
          409: 'That email or username is already taken.',
          400: 'Check your details: password must be at least 8 characters.',
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreenLayout>
      <ThemedText style={[Typography.h3, styles.title]}>Create account</ThemedText>

      <FormField label="Username" value={username} onChangeText={setUsername} />
      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <FormField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="newPassword"
      />

      {error && (
        <ThemedText style={Typography.bodyMedium} themeColor="error">
          {error}
        </ThemedText>
      )}

      <Button label="Create account" size="large" loading={isSubmitting} onPress={handleSubmit} />

      <Link href="/login">
        <ThemedText style={Typography.subtitleSmall} themeColor="primary">
          Already have an account? Log in
        </ThemedText>
      </Link>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.three,
  },
});
