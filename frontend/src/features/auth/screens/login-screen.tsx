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

export function LoginScreen() {
  const { login } = useAuthActions();
  const passwordRef = useRef<TextInput>(null);
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
      await login({ email, password });
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
      <ThemedText style={[Typography.h3, styles.title]}>Welcome back</ThemedText>

      <FormField
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
        textContentType="password"
        placeholder="Your password"
        error={fieldErrors.password}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      {error && (
        <ThemedText style={Typography.bodyMedium} themeColor="error">
          {error}
        </ThemedText>
      )}

      <View style={styles.action}>
        <Button label="Log in" size="large" loading={isSubmitting} onPress={handleSubmit} />
      </View>

      <Link href="/register" style={styles.link}>
        <ThemedText style={Typography.subtitleSmall} themeColor="textSecondary">
          Need an account?{' '}
          <ThemedText
            style={[Typography.subtitleSmall, { fontFamily: Fonts.body.semiBold }]}
            themeColor="primary">
            Register
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
