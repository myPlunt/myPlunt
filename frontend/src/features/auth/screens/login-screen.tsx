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

export function LoginScreen() {
  const { login } = useAuthActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
    } catch (err) {
      setError(describeError(err, { 401: 'Invalid email or password.' }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreenLayout>
      <ThemedText style={[Typography.h3, styles.title]}>Log in</ThemedText>

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
        textContentType="password"
      />

      {error && (
        <ThemedText style={Typography.bodyMedium} themeColor="error">
          {error}
        </ThemedText>
      )}

      <Button label="Log in" size="large" loading={isSubmitting} onPress={handleSubmit} />

      <Link href="/register">
        <ThemedText style={Typography.subtitleSmall} themeColor="primary">
          Need an account? Register
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
