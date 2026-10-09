import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Fonts, Spacing, Typography } from '@/constants/theme';
import { AuthScreenLayout } from '@/features/auth/components/auth-screen-layout';
import { FormField } from '@/features/auth/components/form-field';
import { useAuthActions } from '@/features/auth/use-auth-actions';
import { ApiError, describeError } from '@/lib/auth/api-client';

export function RegisterScreen() {
  const { register } = useAuthActions();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await register({ username, email, password });
    } catch (err) {
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
    <AuthScreenLayout>
      <ThemedText style={[Typography.h3, styles.title]}>Start your plant family!</ThemedText>

      <FormField
        label="Username"
        value={username}
        onChangeText={setUsername}
        placeholder="carlos"
        error={fieldErrors.username}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <FormField
        ref={emailRef}
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="you@example.com"
        error={fieldErrors.email}
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <FormField
        ref={passwordRef}
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="newPassword"
        placeholder="••••••••"
        error={fieldErrors.password}
        helperText={password.length >= 8 ? '✓ At least 8 characters' : 'At least 8 characters'}
        helperSuccess={password.length >= 8}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      {error && (
        <ThemedText style={Typography.bodyMedium} themeColor="error">
          {error}
        </ThemedText>
      )}

      <View style={styles.action}>
        <Button label="Create account" size="large" loading={isSubmitting} onPress={handleSubmit} />
      </View>

      <Link href="/login" style={styles.link}>
        <ThemedText style={Typography.subtitleSmall} themeColor="textSecondary">
          Already have an account?{' '}
          <ThemedText
            style={[Typography.subtitleSmall, { fontFamily: Fonts.body.semiBold }]}
            themeColor="primary">
            Log in
          </ThemedText>
        </ThemedText>
      </Link>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.four,
  },
  action: {
    marginTop: Spacing.four,
  },
  link: {
    alignSelf: 'center',
    marginTop: Spacing.three,
  },
});
