import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { AuthScreenLayout } from '@/features/auth/components/auth-screen-layout';
import { FormField } from '@/components/ui/form-field';
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
      <Text className="type-h3 mb-6 text-text">Welcome back!</Text>

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

      {error && <Text className="type-body-medium text-error">{error}</Text>}

      <View className="mt-6">
        <Button label="Log in" size="large" loading={isSubmitting} onPress={handleSubmit} />
      </View>

      <View className="mt-4 items-center">
        <Link href="/register">
          <Text className="type-subtitle-small text-text-secondary">
            Need an account?{' '}
            <Text className="font-body-semibold text-primary">Register</Text>
          </Text>
        </Link>
      </View>
    </AuthScreenLayout>
  );
}
