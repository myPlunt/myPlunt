import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
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
      <Text className="type-h3 mb-6 text-text">Start your plant family!</Text>

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

      {error && <Text className="type-body-medium text-error">{error}</Text>}

      <View className="mt-6">
        <Button label="Create account" size="large" loading={isSubmitting} onPress={handleSubmit} />
      </View>

      <View className="mt-4 items-center">
        <Link href="/login">
          <Text className="type-subtitle-small text-text-secondary">
            Already have an account?{' '}
            <Text className="font-body-semibold text-primary">Log in</Text>
          </Text>
        </Link>
      </View>
    </AuthScreenLayout>
  );
}
